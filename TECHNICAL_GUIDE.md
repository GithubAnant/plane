# 🚀 Building Multi-Device 3D Experiences
## Complete Technical Guide: From Concept to Production

> **What you'll learn**: How to build games where your phone controls 3D action in the browser. Whether it's a fishing game, paper plane simulator, or racing game—this guide covers everything.

---

## 📋 Table of Contents

### Part 1: Understanding the System
- [Core Concept](#core-concept)
- [When to Use This Architecture](#when-to-use-this-architecture)
- [Technology Choices Explained](#technology-choices-explained)

### Part 2: Implementation Guide
- [Project Setup (30 min)](#project-setup)
- [WebSocket Server (PartyKit)](#websocket-server)
- [Mobile Controller](#mobile-controller)
- [Desktop 3D Scene](#desktop-3d-scene)
- [State Management](#state-management)

### Part 3: Advanced Techniques
- [Physics Systems](#physics-systems)
- [Performance Optimization](#performance-optimization)
- [Custom Shaders](#custom-shaders)
- [Multiplayer Scaling](#multiplayer-scaling)

### Part 4: Production
- [Deployment](#deployment)
- [Common Issues & Solutions](#common-issues--solutions)
- [Testing Strategy](#testing-strategy)

---

## Core Concept

### The Big Idea

**Problem**: Traditional browser 3D games use keyboard/mouse. Boring.

**Solution**: Your phone becomes a motion controller. Tilt it, and watch 3D objects respond instantly on your desktop screen.

**How It Works**:
```
┌──────────────┐           ┌────────────────┐
│ Phone Gyro   │ ─────────>│   WebSocket    │
│ (Controller) │   60fps   │    Server      │
└──────────────┘           └────────┬───────┘
                                    │
                                    ↓
                           ┌────────────────┐
                           │  Desktop 3D    │
                           │  (Renderer)    │
                           └────────────────┘
```

### Real-World Examples

**1. This Fishing Game**
- Phone tilt = fishing rod movement
- Desktop = 3D pond with fish
- Physics = realistic rope/hook

**2. Paper Plane Game** (Your Next Project!)
```javascript
// Phone tilts left → Plane banks left
// Phone tilts forward → Plane dives
// Flick phone up → Plane does loop
```

**3. Racing Game**
- Phone = steering wheel
- Desktop = 3D race track
- Accelerometer = gas/brake

**4. VR-Lite Experience**
- Phone = 6DOF controller
- Desktop = immersive 3D world
- No VR headset needed!

---

## When to Use This Architecture

### ✅ Perfect For:
- Games needing intuitive motion controls
- Experiences where desktop shows, phone controls
- Prototypes/demos (setup in hours, not days)
- Local multiplayer (everyone in same room)
- Art installations/exhibits

### ❌ Not Ideal For:
- Traditional single-player games (keyboard/mouse is fine)
- Apps needing millisecond precision (WebSocket has ~16ms latency)
- Pure mobile games (just make a mobile app)
- Massive multiplayer (use dedicated game servers)

---

## Technology Choices Explained

### React Three Fiber (R3F)

**What**: React renderer for Three.js

**Why**: Declarative 3D is easier to maintain
```javascript
// Traditional Three.js = Imperative (100 lines)
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
// ... lots more

// React Three Fiber = Declarative (5 lines)
<mesh>
  <boxGeometry />
  <meshStandardMaterial color="red" />
</mesh>
```

**Alternatives**:
- Babylon.js - Heavier, more features
- Vanilla Three.js - More control, more code
- PlayCanvas - Editor-based, less code flexibility

### PartyKit

**What**: Serverless WebSocket platform

**Why**: Zero backend code
```bash
# Create server
npx partykit deploy

# That's it. Done. You now have a WebSocket server.
```

**Alternatives**:
- Socket.io + Express - More control, must manage servers
- Firebase Realtime - Limited WebSocket features
- Supabase Realtime - Postgres-focused, overkill for games

### Rapier Physics

**What**: WebAssembly physics engine

**Why**: Realistic motion without the math
```javascript
<RigidBody>
  <mesh>
    {/* This falls, bounces, collides automatically */}
  </mesh>
</RigidBody>
```

**Alternatives**:
- Cannon.js - JavaScript (slower)
- Ammo.js - More features, harder to use
- PhysX - Requires backend

### Zustand

**What**: Tiny state management

**Why**: Redux without the boilerplate
```javascript
// That's the entire store. No actions, reducers, middleware.
const useStore = create((set) => ({
  data: null,
  setData: (d) => set({ data: d })
}));
```

**Alternatives**:
- Redux - Overkill for this
- Context API - Re-render issues
- Jotai/Recoil - More complexity

---

## Project Setup

### Step 1: Create Project (2 min)

```bash
# Initialize
npm create vite@latest my-game -- --template react
cd my-game

# Install dependencies
npm install three @react-three/fiber @react-three/drei @react-three/rapier
npm install zustand partysocket partykit
npm install react-qr-code eventemitter3 gsap

# Dev dependencies
npm install --save-dev @types/three

# Start dev server
npm run dev
```

### Step 2: File Structure (3 min)

Create this structure:

```
src/
├── App.jsx                      # Main entry, device routing
├── main.jsx                     # React root
│
├── Experience/                  # 3D scene (desktop only)
│   ├── index.jsx               # Scene setup
│   ├── Camera.jsx              # Camera controller
│   ├── PlayerController.jsx   # Phone-controlled object
│   └── Environment.jsx         # World (ground, sky, etc.)
│
├── Ui/
│   ├── QRDisplay.jsx           # Desktop: shows QR code
│   └── mobile/
│       ├── AccessScreen.jsx    # Mobile: permission request
│       └── ActiveScreen.jsx    # Mobile: gyroscope UI
│
├── hooks/
│   ├── usePartyKitConnection.js  # WebSocket connection logic
│   └── usePartyKitStore.js       # WebSocket state
│
└── store/
    └── index.js                  # Global game state

partykit/
└── index.js                      # WebSocket server
```

### Step 3: Configuration (5 min)

**vite.config.js**:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true,  // Expose to network
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io']  // For tunneling
  }
});
```

**partykit.json**:
```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "my-game",
  "main": "partykit/index.js"
}
```

---

## WebSocket Server

### Minimal Server (partykit/index.js)

```javascript
class GameServer {
  constructor(room) {
    this.room = room;
    this.devices = new Map();
  }

  onConnect(conn, ctx) {
    console.log(`Device ${conn.id} connected to room ${this.room.id}`);
    
    // Send welcome message
    conn.send(JSON.stringify({
      type: 'connected',
      roomId: this.room.id,
      yourId: conn.id
    }));
  }

  onMessage(message, sender) {
    const data = JSON.parse(message);

    if (data.type === 'register') {
      // Device identifies itself
      this.devices.set(sender.id, {
        deviceType: data.deviceType,  // 'mobile' or 'desktop'
        connectedAt: Date.now()
      });

      // Notify all devices
      this.room.broadcast(JSON.stringify({
        type: 'device-joined',
        deviceType: data.deviceType,
        totalDevices: this.devices.size
      }));
    }

    if (data.type === 'data') {
      // Forward data to all other devices
      this.room.broadcast(
        JSON.stringify({
          type: 'data',
          from: sender.id,
          payload: data.payload
        }),
        [sender.id]  // Exclude sender
      );
    }
  }

  onClose(conn) {
    this.devices.delete(conn.id);
    this.room.broadcast(JSON.stringify({
      type: 'device-left',
      deviceId: conn.id
    }));
  }
}

export default GameServer;
```

### Deploy Server

```bash
npx partykit deploy
# Output: Deployed to https://my-game-username.partykit.dev
```

Save that URL! You'll need it in your client code.

---

## Mobile Controller

### Permission & Setup (Ui/mobile/AccessScreen.jsx)

```javascript
export const AccessScreen = ({ onGranted }) => {
  const requestPermission = async () => {
    // iOS 13+ requires explicit permission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          onGranted();
        } else {
          alert('Permission denied! Cannot access gyroscope.');
        }
      } catch (error) {
        console.error('Permission error:', error);
      }
    } else {
      // Android/older iOS - no permission needed
      onGranted();
    }
  };

  return (
    <div style={styles.container}>
      <h1>🎮 Controller Mode</h1>
      <p>This app needs access to your phone's motion sensors.</p>
      <button onClick={requestPermission} style={styles.button}>
        Grant Access
      </button>
      <p style={styles.note}>
        ⚠️ HTTPS required! Won't work on http://
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center'
  },
  button: {
    padding: '15px 30px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  note: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#666'
  }
};
```

### Active Controller (Ui/mobile/ActiveScreen.jsx)

```javascript
import { useEffect, useRef, useState } from 'react';
import { usePartyKitStore } from '@/hooks/usePartyKitStore';

export const ActiveScreen = () => {
  const sendData = usePartyKitStore((state) => state.sendData);
  const [debugInfo, setDebugInfo] = useState('');
  
  // Store orientation data
  const latestOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const calibration = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // Handle device orientation events
  useEffect(() => {
    const handleOrientation = (event) => {
      latestOrientation.current = {
        alpha: event.alpha || 0,  // 0-360° (compass)
        beta: event.beta || 0,    // -180 to 180° (pitch)
        gamma: event.gamma || 0   // -90 to 90° (roll)
      };
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // Send data 60 times per second
    const interval = setInterval(() => {
      const raw = latestOrientation.current;
      const cal = calibration.current;

      // Apply calibration offset
      const calibrated = {
        alpha: normalizeAngle(raw.alpha - cal.alpha),
        beta: raw.beta - cal.beta,
        gamma: raw.gamma - cal.gamma
      };

      // Update debug display
      setDebugInfo(
        `α:${calibrated.alpha.toFixed(1)}° ` +
        `β:${calibrated.beta.toFixed(1)}° ` +
        `γ:${calibrated.gamma.toFixed(1)}°`
      );

      // Send to server
      sendData({
        type: 'orientation',
        ...calibrated,
        timestamp: Date.now()
      });
    }, 16);  // ~60fps

    return () => {
      clearInterval(interval);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [sendData]);

  // Calibrate: set current position as "zero"
  const handleCalibrate = () => {
    calibration.current = { ...latestOrientation.current };
    // Optional: haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div style={styles.container}>
      <h1>🎣 Controller Active</h1>
      <p>Tilt your phone to control</p>
      
      <button onClick={handleCalibrate} style={styles.calibrateBtn}>
        📍 Recalibrate
      </button>

      <div style={styles.debug}>
        {debugInfo || 'Waiting for gyro...'}
      </div>

      <div style={styles.instructions}>
        <p>💡 Hold phone comfortably</p>
        <p>💡 Press calibrate to reset zero point</p>
        <p>💡 Tilt to control the game</p>
      </div>
    </div>
  );
};

// Normalize angle to -180 to 180
function normalizeAngle(angle) {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  calibrateBtn: {
    padding: '15px 30px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    margin: '20px',
    cursor: 'pointer'
  },
  debug: {
    fontFamily: 'monospace',
    fontSize: '20px',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'lime',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '20px',
    minWidth: '280px',
    textAlign: 'center'
  },
  instructions: {
    marginTop: '40px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center'
  }
};
```

**Key Concepts:**

1. **Calibration**: Users rarely hold phones in exact reference position. Let them set their own "zero point".

2. **60fps Updates**: 16ms interval = ~60 updates per second = smooth motion.

3. **Debug Display**: Always show gyro values on-screen during development.

4. **HTTPS Requirement**: Mobile browsers block DeviceOrientation on HTTP. Must use HTTPS (ngrok, Vercel, PartyKit deploy).

---

## Desktop 3D Scene

### Main App Router (App.jsx)

```javascript
import { Canvas } from '@react-three/fiber';
import { usePartyKitConnection } from './hooks/usePartyKitConnection';
import { MobileController } from './Ui/mobile/MobileController';
import { QRDisplay } from './Ui/QRDisplay';
import { Experience } from './Experience';

function App() {
  // Detect device type from URL
  const roomId = new URLSearchParams(window.location.search).get('room');
  const deviceType = roomId ? 'mobile' : 'desktop';

  // Connect to WebSocket
  usePartyKitConnection(deviceType);

  // Mobile view: controller UI
  if (deviceType === 'mobile') {
    return <MobileController />;
  }

  // Desktop view: 3D scene + QR code
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <QRDisplay />
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <Experience />
      </Canvas>
    </div>
  );
}

export default App;
```

### 3D Scene Setup (Experience/index.jsx)

```javascript
import { Physics } from '@react-three/rapier';
import { PlayerController } from './PlayerController';
import { Environment } from './Environment';
import { Camera } from './Camera';

export const Experience = () => {
  return (
    <>
      {/* Background */}
      <color attach="background" args={['#87CEEB']} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Physics simulation */}
      <Physics gravity={[0, -9.8, 0]}>
        <Environment />
        <PlayerController />
      </Physics>

      {/* Camera controls */}
      <Camera />
    </>
  );
};
```

### Phone-Controlled Object (Experience/PlayerController.jsx)

```javascript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { usePartyKitStore } from '@/hooks/usePartyKitStore';

export const PlayerController = () => {
  const meshRef = useRef();
  const sensitivity = 0.1;

  useFrame((state, delta) => {
    // Get latest mobile data from store
    const mobileData = usePartyKitStore.getState().mobileData;
    
    if (!mobileData || !meshRef.current) return;

    // Convert degrees to radians
    const beta = THREE.MathUtils.degToRad(mobileData.beta);
    const gamma = THREE.MathUtils.degToRad(mobileData.gamma);
    const alpha = THREE.MathUtils.degToRad(mobileData.alpha);

    // Smooth interpolation
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      beta * sensitivity,
      delta * 5
    );

    meshRef.current.rotation.z = THREE.MathUtils.lerp(
      meshRef.current.rotation.z,
      gamma * sensitivity,
      delta * 5
    );

    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      alpha * sensitivity * 2,
      delta * 3
    );
  });

  return (
    <RigidBody type="kinematicPosition">
      <mesh ref={meshRef} position={[0, 2, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </RigidBody>
  );
};
```

**For Paper Plane:**
```javascript
// Replace box with plane model
<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
  <primitive object={planeModel.scene} />
</mesh>

// Phone controls plane orientation
useFrame(() => {
  const { beta, gamma, alpha } = mobileData;
  
  // Roll left/right
  meshRef.current.rotation.z = gamma * 0.05;
  
  // Pitch up/down
  meshRef.current.rotation.x = beta * 0.05;
  
  // Move forward based on pitch
  meshRef.current.position.z -= Math.sin(beta * 0.01) * delta * 5;
});
```

---

## State Management

### WebSocket Store (hooks/usePartyKitStore.js)

```javascript
import { create } from 'zustand';

export const usePartyKitStore = create((set, get) => ({
  // State
  status: 'disconnected',
  ws: null,
  room: null,
  mobileData: null,
  connectedDevices: [],

  // Actions
  connect: (deviceType = 'desktop') => {
    const { ws: existingWs } = get();
    if (existingWs) existingWs.close();

    // Generate or get room ID
    const urlRoom = new URLSearchParams(window.location.search).get('room');
    const roomId = urlRoom || Math.random().toString(36).substring(2, 10);

    console.log(`🎈 Connecting to room: ${roomId} as ${deviceType}`);
    set({ status: 'connecting', room: roomId });

    // Connect to PartyKit
    const ws = new WebSocket(
      `wss://my-game-username.partykit.dev/party/${roomId}`
    );

    ws.onopen = () => {
      console.log('✅ Connected!');
      set({ status: 'connected' });
      
      // Register device type
      ws.send(JSON.stringify({ 
        type: 'register', 
        deviceType 
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      set({ lastMessage: data });

      // Handle device list updates
      if (data.type === 'device-joined' || data.type === 'device-left') {
        set({ connectedDevices: data.totalDevices || 0 });
      }

      // Handle orientation data from mobile
      if (data.type === 'data' && data.payload?.type === 'orientation') {
        set({ mobileData: data.payload });
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      set({ status: 'error' });
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected');
      set({ status: 'disconnected', ws: null });
    };

    set({ ws });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null, status: 'disconnected' });
    }
  },

  sendData: (payload) => {
    const { ws } = get();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'data', payload }));
    } else {
      console.warn('⚠️ WebSocket not connected');
    }
  }
}));
```

### Connection Hook (hooks/usePartyKitConnection.js)

```javascript
import { useEffect } from 'react';
import { usePartyKitStore } from './usePartyKitStore';

export function usePartyKitConnection(deviceType = 'desktop') {
  const connect = usePartyKitStore((state) => state.connect);
  const disconnect = usePartyKitStore((state) => state.disconnect);

  useEffect(() => {
    connect(deviceType);
    return () => disconnect();
  }, [deviceType, connect, disconnect]);
}
```

### QR Code Display (Ui/QRDisplay.jsx)

```javascript
import QRCode from 'react-qr-code';
import { usePartyKitStore } from '@/hooks/usePartyKitStore';

export const QRDisplay = () => {
  const roomId = usePartyKitStore((state) => state.room);
  const status = usePartyKitStore((state) => state.status);
  const devices = usePartyKitStore((state) => state.connectedDevices);

  if (!roomId) return null;

  const baseUrl = window.location.origin;
  const mobileUrl = `${baseUrl}/?room=${roomId}`;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3>📱 Connect Mobile Controller</h3>
        <QRCode value={mobileUrl} size={150} />
        <p style={styles.url}>{mobileUrl}</p>
        <div style={styles.status}>
          <span style={{
            ...styles.indicator,
            backgroundColor: status === 'connected' ? '#4CAF50' : '#FFC107'
          }} />
          {status === 'connected' ? 'Connected' : 'Connecting...'}
        </div>
        <p style={styles.deviceCount}>
          {devices} device{devices !== 1 ? 's' : ''} connected
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000
  },
  card: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    minWidth: '200px'
  },
  url: {
    fontSize: '10px',
    color: '#666',
    marginTop: '10px',
    wordBreak: 'break-all'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '10px',
    fontSize: '14px'
  },
  indicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '8px'
  },
  deviceCount: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px'
  }
};
```

---

## Deployment

### Production Checklist

**1. Deploy PartyKit Server**
```bash
npx partykit deploy
# Save the URL: https://my-game-username.partykit.dev
```

**2. Update WebSocket URL in Code**
```javascript
// hooks/usePartyKitStore.js
const ws = new WebSocket(
  `wss://my-game-username.partykit.dev/party/${roomId}`
);
```

**3. Build Frontend**
```bash
npm run build
```

**4. Deploy to Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then:
# Your app is live at: https://my-game.vercel.app
```

**Alternative: Deploy to Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Your app is live at: https://my-game.netlify.app
```

### Important: HTTPS is Required

Mobile gyroscope only works on HTTPS. All these platforms provide HTTPS automatically:
- ✅ Vercel (free)
- ✅ Netlify (free)
- ✅ PartyKit (free)
- ✅ GitHub Pages (free, but needs setup)

For local development with real phones:
```bash
# Use ngrok
ngrok http 5173

# Or localtunnel
npx localtunnel --port 5173
```

---

## Common Issues & Solutions

### Issue 1: Gyroscope Returns All Zeros

**Symptoms**: Mobile shows "α:0.0° β:0.0° γ:0.0°"

**Causes**:
1. Using HTTP instead of HTTPS
2. Permission not granted
3. Device doesn't have gyroscope

**Solutions**:
```javascript
// 1. Check if HTTPS
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  alert('⚠️ HTTPS required for gyroscope!');
}

// 2. Test permission API
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
  const permission = await DeviceOrientationEvent.requestPermission();
  console.log('Permission:', permission);
}

// 3. Test if gyroscope exists
window.addEventListener('deviceorientation', (event) => {
  if (event.alpha === null && event.beta === null && event.gamma === null) {
    alert('No gyroscope detected!');
  }
});
```

### Issue 2: Desktop Not Receiving Data

**Symptoms**: Mobile sends data, desktop doesn't update

**Debug Steps**:
```javascript
// In PlayerController useFrame
useFrame(() => {
  const mobileData = usePartyKitStore.getState().mobileData;
  console.log('Mobile data:', mobileData);  // Should update 60fps
  
  if (!mobileData) {
    console.warn('No mobile data yet!');
  }
});
```

**Common Causes**:
1. WebSocket not connected
2. Wrong message type checking
3. Store not updating

**Fix**:
```javascript
// usePartyKitStore.js - ensure this line exists
if (data.type === 'data' && data.payload?.type === 'orientation') {
  set({ mobileData: data.payload });  // ← This must run
  console.log('✅ Stored mobile data:', data.payload);
}
```

### Issue 3: Jittery/Choppy Movement

**Symptoms**: 3D object jumps instead of smooth motion

**Solution**: Add lerp (linear interpolation)
```javascript
// BAD: Direct assignment
meshRef.current.rotation.x = beta;

// GOOD: Smooth interpolation
meshRef.current.rotation.x = THREE.MathUtils.lerp(
  meshRef.current.rotation.x,  // current
  beta,                         // target
  delta * 5                     // speed
);
```

### Issue 4: Connection Drops Randomly

**Symptoms**: WebSocket disconnects after a few minutes

**Solution**: Add reconnection logic
```javascript
// hooks/usePartyKitStore.js
ws.onclose = () => {
  console.log('🔌 Disconnected, reconnecting...');
  set({ status: 'disconnected', ws: null });
  
  // Reconnect after 2 seconds
  setTimeout(() => {
    get().connect(deviceType);
  }, 2000);
};
```

### Issue 5: Latency/Lag

**Symptoms**: Movement feels delayed

**Causes**:
1. Sending too much data
2. Server processing slow
3. Network latency

**Solutions**:
```javascript
// 1. Reduce send frequency (60fps → 30fps)
setInterval(() => {
  sendData(orientation);
}, 33);  // 33ms = ~30fps

// 2. Send less data
sendData({
  type: 'orientation',
  // Round to 1 decimal place
  alpha: Math.round(calibrated.alpha * 10) / 10,
  beta: Math.round(calibrated.beta * 10) / 10,
  gamma: Math.round(calibrated.gamma * 10) / 10
  // Don't send timestamp if not needed
});

// 3. Optimize server
onMessage(message, sender) {
  // Don't parse if not needed
  if (message.includes('"type":"orientation"')) {
    this.room.broadcast(message, [sender.id]);  // Forward as-is
  }
}
```

---

## Advanced Techniques

### Rope Physics (Fishing Rod Example)

```javascript
import { useRopeJoint } from '@react-three/rapier';

export const FishingRod = () => {
  const rod = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const hook = useRef();

  // Connect with rope constraints
  useRopeJoint(rod, j1, [[0,0,0], [0,0,0], 0.5]);
  useRopeJoint(j1, j2, [[0,0,0], [0,0,0], 0.5]);
  useRopeJoint(j2, j3, [[0,0,0], [0,0,0], 0.5]);
  useRopeJoint(j3, hook, [[0,0,0], [0,0,0], 0.5]);

  return (
    <>
      <RigidBody ref={rod} type="kinematicPosition">
        <Box args={[0.1, 2, 0.1]} />
      </RigidBody>
      <RigidBody ref={j1}><Sphere args={[0.05]} /></RigidBody>
      <RigidBody ref={j2}><Sphere args={[0.05]} /></RigidBody>
      <RigidBody ref={j3}><Sphere args={[0.05]} /></RigidBody>
      <RigidBody ref={hook}>
        <Hook />
      </RigidBody>
    </>
  );
};
```

### Instanced Rendering (Many Objects)

```javascript
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

export const Fish = ({ count = 100 }) => {
  const fishRef = useRef();

  useFrame((state, delta) => {
    // Update all 100 fish efficiently
    for (let i = 0; i < count; i++) {
      const fish = fishRef.current.instances[i];
      fish.position.x += Math.sin(state.clock.elapsedTime + i) * delta;
    }
  });

  return (
    <InstancedMesh2 ref={fishRef} count={count}>
      <boxGeometry args={[0.3, 0.1, 0.1]} />
      <meshStandardMaterial color="orange" />
    </InstancedMesh2>
  );
};
```

### Haptic Feedback

```javascript
// Mobile controller
const triggerHaptic = (intensity = 50) => {
  if (navigator.vibrate) {
    navigator.vibrate(intensity);
  }
};

// On collision
eventBus.on('fish-caught', () => {
  triggerHaptic(100);  // Strong vibration
});
```

---

## Testing Strategy

### Local Testing (Same Device)

```javascript
// Open two browser windows
// Window 1: http://localhost:5173
// Window 2: http://localhost:5173?room=test123

// Both connect to same room
// Simulate mobile in devtools (F12 → Device Toolbar)
```

### Real Device Testing

```bash
# 1. Start dev server
npm run dev

# 2. Get your local IP
# Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig

# 3. Open on desktop: http://192.168.1.x:5173
# 4. Scan QR with phone (must be on same WiFi)
```

### Production Testing

```bash
# Deploy to staging first
vercel --prod=false

# Test with real devices
# If good:
vercel --prod
```

---

## What's Next?

### Enhance Your Game

1. **Add Multiplayer**
```javascript
// Multiple mobiles, one desktop
// Each mobile controls different object
const playerId = new URLSearchParams(window.location.search).get('player');
```

2. **Add Sound**
```javascript
import { useSound } from 'use-sound';
const [play] = useSound('/sounds/catch.mp3');
eventBus.on('fish-caught', play);
```

3. **Add Scoring**
```javascript
const useGameStore = create((set) => ({
  score: 0,
  addScore: (points) => set((state) => ({ score: state.score + points }))
}));
```

4. **Add Tutorial**
```javascript
const [showTutorial, setShowTutorial] = useState(true);
<Tutorial visible={showTutorial} onComplete={() => setShowTutorial(false)} />
```

### Build Different Games

**Paper Plane:**
- Phone tilt = plane orientation
- Desktop = sky with clouds, birds
- Physics = realistic flight

**Racing:**
- Phone tilt = steering
- Desktop = race track
- Physics = car handling

**Art/Paint:**
- Phone tilt = brush position
- Desktop = canvas
- No physics needed

---

## Resources

### Official Docs
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Rapier Physics](https://rapier.rs/)
- [PartyKit](https://docs.partykit.io/)
- [Zustand](https://docs.pmnd.rs/zustand)

### Learning
- [Three.js Journey](https://threejs-journey.com/)
- [R3F Examples](https://docs.pmnd.rs/react-three-fiber/getting-started/examples)
- [Game Dev Patterns](https://gameprogrammingpatterns.com/)

### Community
- [Poimandres Discord](https://discord.gg/poimandres) - R3F help
- [Three.js Discourse](https://discourse.threejs.org/)
- [PartyKit Discord](https://discord.gg/partykit)

---

**Happy building! 🚀**

*Questions? Issues? Fork this repo and open an issue or PR.*
