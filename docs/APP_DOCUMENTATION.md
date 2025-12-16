# 🎣 Fishing Game - Complete Technical Documentation
## From Zero to Production: Building Multi-Device 3D Experiences

> **Purpose**: This document will teach you how to build a dual-device 3D game from scratch. Whether you want to recreate this fishing game or build a paper plane flying game controlled by your phone, this guide covers everything you need.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack Deep Dive](#technology-stack-deep-dive)
3. [Architecture Patterns](#architecture-patterns)
4. [Building From Scratch](#building-from-scratch)
5. [Core Systems Implementation](#core-systems-implementation)
6. [Advanced Techniques](#advanced-techniques)
7. [Deployment & Production](#deployment--production)
8. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Project Overview

### What This App Does

An interactive 3D fishing game with a **groundbreaking control scheme**: your mobile phone becomes the controller. Tilt your phone to move the fishing rod in 3D space, catch fish, and experience realistic physics—all rendered in your desktop browser.

### Core Innovation: Dual-Device Architecture

**The Problem We Solve:**
- Traditional 3D games are limited to keyboard/mouse input
- Mobile gyroscope data is powerful but underutilized
- WebSocket complexity makes multi-device apps hard to build

**Our Solution:**
- Mobile phone = Motion controller (accelerometer/gyroscope)
- Desktop browser = Visual display (3D rendering)
- PartyKit = Instant real-time sync (no backend code needed)

### Real-World Applications

This architecture works for:
- **Paper plane flying game** - Tilt phone to fly, desktop shows 3D flight
- **Racing game** - Phone as steering wheel
- **VR-lite experiences** - Phone as 6DOF controller
- **Presentation remotes** - Phone controls desktop slides
- **Collaborative art** - Multiple phones paint on shared canvas

---

## Technology Stack Deep Dive

### Why Each Technology Was Chosen

#### React Three Fiber (R3F) - The Foundation
```javascript
import { Canvas } from "@react-three/fiber";

// Traditional Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
renderer.render(scene, camera);

// React Three Fiber (declarative!)
<Canvas>
  <mesh>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>
</Canvas>
```

**Why R3F?**
- Declarative 3D = easier to reason about
- React ecosystem = reusable components
- Auto-cleanup = no memory leaks
- Hook-based = clean state management

#### Rapier Physics - Realistic Movement
```javascript
import { RigidBody, Physics } from "@react-three/rapier";

<Physics gravity={[0, -40, 0]}>
  <RigidBody>
    <mesh>
      {/* This box falls and collides realistically */}
    </mesh>
  </RigidBody>
</Physics>
```

**Why Rapier?**
- WebAssembly = near-native performance
- Industry-standard = predictable physics
- React integration = seamless workflow
- Rope joints = perfect for fishing lines

#### PartyKit - Zero-Config WebSocket Server
```javascript
// That's it. Seriously.
class PartyServer {
  onMessage(message, sender) {
    this.room.broadcast(message); // Send to all clients
  }
}
```

**Why PartyKit?**
- Deploy in 30 seconds (`npx partykit deploy`)
- No servers to manage
- Automatic scaling
- Free tier = perfect for prototypes

#### Zustand - Lightweight State Management
```javascript
// Redux = 200 lines of boilerplate
// Zustand = 5 lines
const useStore = create((set) => ({
  mobileData: null,
  setMobileData: (data) => set({ mobileData: data })
}));
```

**Why Zustand?**
- No boilerplate
- TypeScript ready
- DevTools support
- Perfect for WebSocket state

---

## Architecture Patterns

### Pattern 1: Device Type Detection

### Pattern 1: Device Type Detection

**The URL-based routing pattern:**

```javascript
// App.jsx - Entry point
function App() {
  // ✅ Simple, elegant device detection
  const deviceType = new URLSearchParams(window.location.search).get("room")
    ? "mobile"      // URL has ?room=abc123
    : "desktop";    // No room parameter

  // Two completely different UIs based on device
  if (deviceType === "mobile") {
    return <MobileController />;  // Gyroscope interface
  }
  return <DesktopGame />;  // 3D scene
}
```

**Why this pattern?**
- No backend device detection needed
- Works across all browsers/platforms
- QR code naturally includes the room parameter
- Easy to test both modes locally

**For your paper plane game:**
```javascript
// Desktop: http://localhost:5173 → Shows 3D plane flying
// Mobile: http://localhost:5173?room=xyz → Shows tilt controller
```

---

### Pattern 2: Real-time State Sync (The Core Pattern)

**Three-tier architecture:**

```
┌───────────────┐
│  Mobile Phone │  ← Reads gyroscope
└───────┬───────┘
        │ WebSocket
        ↓
┌──────────────────┐
│  PartyKit Server │  ← Broadcasts to all devices
└────────┬─────────┘
         │ WebSocket  
         ↓
┌────────────────┐
│ Desktop Browser│  ← Renders 3D scene
└────────────────┘
```

**Implementation (Step-by-Step):**

#### Step 1: PartyKit Server (`partykit/index.js`)

```javascript
class PartyServer {
  constructor(room) {
    this.room = room;
    this.devices = new Map(); // Track connected devices
  }

  onConnect(conn, ctx) {
    // New device connects
    console.log(`Device ${conn.id} joined room ${this.room.id}`);
    
    // Send room state to newcomer
    conn.send(JSON.stringify({
      type: "connected",
      roomId: this.room.id,
      existingDevices: Array.from(this.devices.keys())
    }));
  }

  onMessage(message, sender) {
    const data = JSON.parse(message);

    switch (data.type) {
      case "register":
        // Device identifies itself
        this.devices.set(sender.id, {
          deviceType: data.deviceType, // "mobile" or "desktop"
          timestamp: Date.now()
        });

        // Notify everyone about new device
        this.room.broadcast(JSON.stringify({
          type: "device-joined",
          deviceType: data.deviceType,
          devices: Array.from(this.devices.entries())
        }));
        break;

      case "data":
        // Mobile sends orientation data
        // Forward to ALL other devices (desktop)
        this.room.broadcast(
          JSON.stringify({
            type: "data",
            from: sender.id,
            payload: data.payload  // {alpha, beta, gamma}
          }),
          [sender.id]  // Don't send back to sender
        );
        break;
    }
  }

  onClose(conn) {
    // Device disconnects
    this.devices.delete(conn.id);
    this.room.broadcast(JSON.stringify({
      type: "device-left",
      connectionId: conn.id
    }));
  }
}

export default PartyServer;
```

**Key Concepts:**
- **Room isolation**: Each room is independent (different fishing games)
- **Broadcast pattern**: One sends, all receive
- **Device tracking**: Know who's connected
- **Type safety**: Message types prevent confusion

#### Step 2: Client WebSocket Store (`usePartyKitStore.js`)

```javascript
import { create } from 'zustand';

export const usePartyKitStore = create((set, get) => ({
  // State
  status: 'disconnected',
  ws: null,
  room: null,
  mobileData: null,  // Latest orientation from mobile

  // Actions
  connect: (deviceType = 'desktop') => {
    const roomId = generateRoomId(); // Random ID or from URL
    
    // Connect to PartyKit
    const ws = new WebSocket(
      `wss://your-app.partykit.dev/party/${roomId}`
    );

    ws.onopen = () => {
      set({ status: 'connected', room: roomId });
      
      // Identify this device
      ws.send(JSON.stringify({ 
        type: 'register', 
        deviceType 
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle orientation data from mobile
      if (data.type === 'data' && data.payload?.type === 'orientation') {
        set({ mobileData: data.payload });  // Store for desktop to read
      }
    };

    set({ ws });
  },

  sendData: (payload) => {
    const { ws } = get();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'data', payload }));
    }
  },

  disconnect: () => {
    get().ws?.close();
    set({ ws: null, status: 'disconnected' });
  }
}));
```

**Critical Pattern: State vs Actions**
- State = what's true now (connected? what data?)
- Actions = how to change state (connect, send, disconnect)
- Zustand makes this trivial

#### Step 3: Mobile Sends Data (`ActiveScreen.jsx`)

```javascript
export const ActiveScreen = () => {
  const sendData = usePartyKitStore((state) => state.sendData);
  const latestOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // Listen to device orientation
  useEffect(() => {
    const handleOrientation = (event) => {
      latestOrientation.current = {
        alpha: event.alpha || 0,  // Compass direction (0-360°)
        beta: event.beta || 0,    // Front-back tilt (-180 to 180°)
        gamma: event.gamma || 0   // Left-right tilt (-90 to 90°)
      };
    };

    // ⚠️ CRITICAL: HTTPS required for mobile gyroscope!
    window.addEventListener("deviceorientation", handleOrientation);

    // Send data 60 times per second
    const interval = setInterval(() => {
      sendData({
        type: "orientation",
        ...latestOrientation.current,
        timestamp: Date.now()
      });
    }, 16);  // 16ms = ~60fps

    return () => {
      clearInterval(interval);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [sendData]);

  return (
    <div>
      <h1>Tilt your phone to control</h1>
      {/* Visual feedback */}
    </div>
  );
};
```

**Why 60fps?**
- Smooth motion = frequent updates
- 16ms = browser frame rate
- Higher = unnecessary bandwidth
- Lower = choppy movement

#### Step 4: Desktop Reads Data (`PlayerController.jsx`)

```javascript
export const PlayerController = () => {
  const rodRef = useRef();

  useFrame((state, delta) => {
    // ✅ Read latest mobile data from store
    const mobileData = usePartyKitStore.getState().mobileData;
    
    if (!mobileData) return;  // No mobile connected yet

    // Convert degrees to radians for Three.js
    const beta = THREE.MathUtils.degToRad(mobileData.beta);
    const gamma = THREE.MathUtils.degToRad(mobileData.gamma);
    const alpha = THREE.MathUtils.degToRad(mobileData.alpha);

    // Apply to 3D object
    rodRef.current.rotation.x = beta * sensitivity;
    rodRef.current.rotation.z = gamma * sensitivity;
    rodRef.current.position.x = alpha * 2;
  });

  return (
    <group ref={rodRef}>
      {/* Fishing rod mesh */}
    </group>
  );
};
```

**Key Insight: useFrame runs every frame**
- 60 times per second
- Reads latest data from store
- Smooth interpolation happens automatically

---

### Pattern 3: QR Code Connection Flow

**The user experience:**

1. Desktop shows QR code
2. Mobile scans → automatically includes room ID
3. Mobile joins same room
4. Connection established

**Implementation:**

```javascript
// Desktop: MobileData.jsx
export const MobileData = () => {
  const roomId = usePartyKitStore((state) => state.room);
  const baseUrl = window.location.origin;  // http://localhost:5173

  return roomId ? (
    <div style={{ position: 'absolute', top: 10, right: 10 }}>
      <QRCode 
        value={`${baseUrl}/?room=${roomId}`}  // ✅ URL includes room
        size={150} 
      />
      <p>Scan to connect mobile</p>
    </div>
  ) : null;
};
```

**For your paper plane game:**
```javascript
<QRCode value={`${baseUrl}/?flight=${roomId}`} />
// Mobile URL: https://yourapp.com/?flight=abc123
```

---

## Building From Scratch

### Project Setup (5 minutes)

```bash
# Create React + Vite project
npm create vite@latest my-game -- --template react
cd my-game

# Install 3D dependencies
npm install three @react-three/fiber @react-three/drei @react-three/rapier

# Install real-time dependencies
npm install zustand partysocket partykit

# Install utilities
npm install react-qr-code eventemitter3

# Start dev server
npm run dev
```

### File Structure

```
my-game/
├── src/
│   ├── App.jsx                    # Device routing
│   ├── main.jsx                   # Entry point
│   │
│   ├── Experience/                # 3D scene components
│   │   ├── index.jsx              # Main scene
│   │   ├── Camera.jsx             # Camera controls
│   │   ├── PlayerController.jsx  # Phone-controlled object
│   │   └── Environment.jsx        # World (ground, sky, etc)
│   │
│   ├── Ui/
│   │   ├── QRDisplay.jsx          # Desktop QR code
│   │   └── mobile/
│   │       ├── AccessScreen.jsx   # Permission request
│   │       └── ActiveScreen.jsx   # Gyroscope controller
│   │
│   ├── hooks/
│   │   ├── usePartyKitConnection.js
│   │   └── usePartyKitStore.js
│   │
│   └── store/
│       └── index.js               # Global game state
│
├── partykit/
│   └── index.js                   # WebSocket server
│
└── public/
    └── assets/                    # 3D models, textures
```

---

## Core Systems Implementation

### System 1: Device Orientation (Mobile Gyroscope)

**Understanding Device Orientation:**

```
      β (beta)
       ↑
       |
   ← - + - → γ (gamma)
       |
       ↓

α (alpha) = compass (0-360°)
β (beta) = pitch (-180 to 180°)  
γ (gamma) = roll (-90 to 90°)
```

**Full implementation with calibration:**

```javascript
export const ActiveScreen = () => {
  const sendData = usePartyKitStore((state) => state.sendData);
  const calibrationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const latestOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // Permission request (iOS 13+ requirement)
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') {
        alert('Gyroscope permission denied!');
        return false;
      }
    }
    return true;
  };

  const handleOrientation = (event) => {
    latestOrientation.current = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0,
    };
  };

  // Calibration: set current position as "zero"
  const handleCalibrate = () => {
    calibrationRef.current = { ...latestOrientation.current };
  };

  useEffect(() => {
    requestPermission().then((granted) => {
      if (!granted) return;

      window.addEventListener("deviceorientation", handleOrientation);

      // Send calibrated data 60fps
      const interval = setInterval(() => {
        const raw = latestOrientation.current;
        const calibration = calibrationRef.current;

        const calibrated = {
          alpha: normalizeAngle(raw.alpha - calibration.alpha),
          beta: raw.beta - calibration.beta,
          gamma: raw.gamma - calibration.gamma,
        };

        sendData({
          type: "orientation",
          ...calibrated,
          timestamp: Date.now(),
        });
      }, 16);

      return () => {
        clearInterval(interval);
        window.removeEventListener("deviceorientation", handleOrientation);
      };
    });
  }, [sendData]);

  return (
    <>
      <button onClick={handleCalibrate}>Calibrate</button>
      <p>Tilt phone to control</p>
    </>
  );
};

// Normalize angles to -180 to 180
function normalizeAngle(angle) {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}
```

**Common Pitfall:** Forgetting calibration means users must hold phone in exact starting position.

---

### System 2: Physics-Based Rope (Advanced)

**The rope system is the star of this game.** Here's how it works:

```javascript
import { useRopeJoint, RigidBody, BallCollider } from "@react-three/rapier";

export const RopeSystem = () => {
  // Create 6 rope segments
  const rodTip = useRef();  // Fixed to fishing rod
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const j4 = useRef();
  const j5 = useRef();
  const hook = useRef();    // Free end

  const segmentLength = 0.65;

  // Connect segments with rope constraints
  useRopeJoint(rodTip, j1, [[0,0,0], [0,0,0], segmentLength]);
  useRopeJoint(j1, j2, [[0,0,0], [0,0,0], segmentLength]);
  useRopeJoint(j2, j3, [[0,0,0], [0,0,0], segmentLength]);
  useRopeJoint(j3, j4, [[0,0,0], [0,0,0], segmentLength]);
  useRopeJoint(j4, j5, [[0,0,0], [0,0,0], segmentLength]);
  useRopeJoint(j5, hook, [[0,0,0], [0,0,0], segmentLength]);

  return (
    <>
      {/* Rod tip - controlled by phone */}
      <RigidBody ref={rodTip} type="kinematicPosition">
        <BallCollider args={[0.1]} />
      </RigidBody>

      {/* Middle segments - physics simulated */}
      <RigidBody ref={j1}><BallCollider args={[0.05]} /></RigidBody>
      <RigidBody ref={j2}><BallCollider args={[0.05]} /></RigidBody>
      <RigidBody ref={j3}><BallCollider args={[0.05]} /></RigidBody>
      <RigidBody ref={j4}><BallCollider args={[0.05]} /></RigidBody>
      <RigidBody ref={j5}><BallCollider args={[0.05]} /></RigidBody>

      {/* Hook - interacts with fish */}
      <RigidBody ref={hook}>
        <BallCollider args={[0.2]} sensor />  {/* sensor = no collision force */}
        <mesh>
          <sphereGeometry args={[0.2]} />
          <meshStandardMaterial color="silver" />
        </mesh>
      </RigidBody>

      {/* Visual rope rendering */}
      <RopeVisual segments={[rodTip, j1, j2, j3, j4, j5, hook]} />
    </>
  );
};
```

**Rope visualization with MeshLine:**

```javascript
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { CatmullRomCurve3, Vector3 } from "three";

const RopeVisual = ({ segments }) => {
  const ropeRef = useRef();
  
  // Create smooth curve from segment positions
  const [curve] = useState(() => new CatmullRomCurve3(
    segments.map(() => new Vector3())
  ));

  useFrame(() => {
    // Update curve points to match physics positions
    segments.forEach((segment, i) => {
      const pos = segment.current.translation();
      curve.points[i].copy(pos);
    });

    // Regenerate smooth curve
    const points = curve.getPoints(32);  // 32 subdivisions
    ropeRef.current.setPoints(points);
  });

  return (
    <mesh>
      <meshLineGeometry ref={ropeRef} />
      <meshLineMaterial color="brown" lineWidth={0.05} />
    </mesh>
  );
};
```

**For paper plane:**
```javascript
// No rope needed, but same pattern for plane tail/ribbon
useRopeJoint(planeTail1, planeTail2, [[0,0,0], [0,0,0], 0.3]);
```

---

### System 3: Instanced Rendering (Performance)
  gamma: tilt_sideways,      // Side tilt
  timestamp: Date.now()
}
```

### 4. Desktop Game Architecture

#### Component Hierarchy:

```
App.jsx
├── MobileData (QR Code Display)
└── Canvas (Three.js Scene)
    └── Experience
        ├── Physics (Rapier)
        │   ├── FishingPool (3D Environment)
        │   ├── PlayerController (Fishing Rod + Hook)
        │   └── Fishes (Fish Instances)
        ├── Particles (Bubbles)
        ├── Camera
        └── ambientLight
```

#### Key 3D Components:

**PlayerController** (`/src/Experience/PlayerController.jsx`)
- Manages fishing rod mesh
- Implements rope physics using `useRopeJoint`
- Rope simulation with 6 segments connected by constraints
- Hook collision detection
- Receives mobile orientation data
- Updates rod position/rotation based on accelerometer

**Rope Physics System:**
```
RodTip → J1 → J2 → J3 → J4 → J5 → Hook
```
- Each joint is a RigidBody with BallCollider
- Connected by rope joints with fixed segment length (0.65 units)
- Forms a CatmullRom curve for smooth rope rendering
- Uses MeshLine for rope visualization

**Fishes** (`/src/Experience/entities/Fishes.jsx`)
- Uses InstancedMesh2 for efficient rendering of multiple fish
- Fish States: IDLE, HOOKED, CAUGHT
- AI behavior:
  - Random swimming patterns
  - Fleeing from hook
  - Hook collision detection
  - Catch animation sequence
- Custom shaders for fish rendering and animations
- Physics-based movement with Rapier

**FishingPool** - The water environment with custom shaders
**Hook** - Interactable fishing hook with collision detection

### 5. State Management

#### Global Store (Zustand - `/src/store/index.js`)
```javascript
{
  mobileData: null,           // Current mobile orientation
  hookPosition: null,         // Hook 3D position
  renderTexture: null         // Render target texture
}
```

#### PartyKit Store (Zustand - `/src/hooks/usePartyKitStore.js`)
```javascript
{
  status: 'disconnected',     // WebSocket status
  devices: [],                // Connected device list
  lastMessage: null,          // Latest message
  ws: null,                   // WebSocket instance
  room: null,                 // Current room ID
  mobileData: null           // Latest orientation data
}
```

### 6. Event System

Uses EventEmitter3 for decoupled communication:

```javascript
// eventBus.js
export const EVENTS = {
  FISH_CAUGHT: 'fish:caught',
  HOOK_COLLIDE: 'hook:collide',
  // ... other events
}
```

Components emit and listen to events without direct coupling.

### 7. Physics System

**Rapier Physics Engine** provides:
- Gravity simulation (0, -40, 0)
- Rigid body dynamics
- Collision detection
- Rope constraints
- Variable time step for stability

### 8. Shader System

Custom shaders for:
- **Fish**: Swimming animation, texture atlas, shadows
- **Water**: Surface effects, reflections
- **Pool**: Pool bottom rendering
- **Foliage**: Vegetation effects

Located in `/src/Experience/shaders/`

## Game Flow

### Desktop Player:

1. Open app → Generate room → Display QR code
2. Wait for mobile connection
3. Mobile connects → Orientation data streams in
4. Use phone tilt to control fishing rod
5. Position hook near fish
6. Fish gets hooked → Catch animation plays
7. Continue fishing

### Mobile Player:

1. Scan QR code from desktop
2. Grant motion sensor permission
3. Calibrate by tapping A button
4. Tilt phone to control rod
5. View simple controller UI

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     MOBILE DEVICE                             │
│  DeviceOrientation API → ActiveScreen → usePartyKitStore     │
└────────────────────────────┬─────────────────────────────────┘
                             │ WebSocket
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                   PARTYKIT SERVER                             │
│            Room-based WebSocket Broadcast                     │
└────────────────────────────┬─────────────────────────────────┘
                             │ WebSocket
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                    DESKTOP BROWSER                            │
│  usePartyKitStore → PlayerController → Fishing Rod Update    │
│       ↓                                                       │
│  Three.js Scene Render → Physics Update → Game Logic         │
└──────────────────────────────────────────────────────────────┘
```

## Key Features Implementation

### 🎮 Mobile Control
- Device orientation API for accelerometer data
- Calibration system to set zero point
- 60 FPS data streaming
- Haptic feedback on interactions

### 🎣 Fishing Mechanics
- Physics-based rope simulation
- Hook collision with fish
- Fish AI with flee/swim behaviors
- Catch animations

### 🌊 3D Environment
- Custom water shaders
- Particle system for bubbles
- Instanced fish rendering for performance
- Realistic lighting

### 🔄 Real-time Sync
- Room-based multiplayer architecture
- Automatic reconnection
- Device presence detection
- Low-latency control

## Development Commands

```bash
npm run dev      # Start development server (Vite + PartyKit)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Setup

The app uses a cloudflare tunnel for PartyKit WebSocket connection:
```javascript
wss://worldcat-air-drag-deviation.trycloudflare.com/party/${roomId}
```

For local development, you'll need to configure your own PartyKit server or update the WebSocket URL.

## File Structure Breakdown

```
/src
├── main.jsx                 # App entry point
├── App.jsx                  # Root component & device routing
├── /Experience              # 3D scene components
│   ├── index.jsx           # Main scene setup
│   ├── Camera.jsx          # Camera controller
│   ├── PlayerController.jsx # Fishing rod mechanics
│   ├── /models             # 3D model components
│   ├── /entities           # Game entities (fish)
│   ├── /shaders            # GLSL shaders
│   └── /Particles          # Particle systems
├── /Ui                      # UI components
│   ├── MobileData.jsx      # QR code display
│   └── /mobile             # Mobile controller UI
├── /hooks                   # Custom React hooks
│   ├── usePartyKitConnection.js
│   └── usePartyKitStore.js
├── /store                   # Zustand stores
└── /utils                   # Utility functions
    ├── eventBus.js         # Event system
    ├── constants.js        # Game constants
    └── normalizeYaw.js     # Orientation normalization

/partykit
└── index.js                 # WebSocket server

/public/assets
├── /models                  # 3D models (.glb files)
└── /textures               # Texture images
```

## Performance Considerations

1. **Instanced Rendering**: Fish use InstancedMesh2 for efficient multi-object rendering
2. **Physics Optimization**: Variable timestep, minimal colliders
3. **WebSocket Throttling**: 60 FPS orientation data (16ms intervals)
4. **Shader Efficiency**: Custom shaders for visual effects without CPU overhead
5. **Lazy Loading**: Suspense boundaries for 3D model loading

## Browser Compatibility

- **Desktop**: Modern browsers with WebGL support
- **Mobile**: iOS Safari 13+, Chrome Mobile 90+ (requires motion sensor permission)
- **WebSocket**: All modern browsers

## Future Enhancement Ideas

- Multiple fishing spots
- Different fish types with varying difficulty
- Score/leaderboard system
- Sound effects and music
- Multiple players in same room
- Fishing rod customization
- Weather effects

## Debugging Tips

1. Check WebSocket connection in browser DevTools
2. Monitor console for PartyKit logs
3. Verify motion sensor permissions on mobile
4. Use React DevTools to inspect component state
5. Check Zustand state with Redux DevTools extension
6. Monitor FPS with Three.js stats panel

---

**Version**: 0.0.1
**Last Updated**: December 2025
**Tech Stack**: React + Three.js + PartyKit
