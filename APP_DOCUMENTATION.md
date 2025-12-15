# 🎣 Fishing Game Application - Technical Documentation

## Overview

This is an interactive 3D fishing game built with React, Three.js, and React Three Fiber. The unique feature of this game is its **dual-device control system** - you can control the fishing rod using your mobile phone's accelerometer while viewing the game on your desktop browser.

## Core Technology Stack

### Frontend Framework
- **React 19.1.1** - UI library
- **Vite 7.1.7** - Build tool and dev server
- **Three.js 0.181.0** - 3D graphics library
- **@react-three/fiber 9.4.0** - React renderer for Three.js
- **@react-three/drei 10.7.6** - Helper components for R3F
- **@react-three/rapier 2.1.0** - Physics engine

### Real-time Communication
- **PartyKit** - WebSocket server for real-time multiplayer/device communication
- **Zustand 5.0.8** - State management

### Additional Libraries
- **GSAP 3.13.0** - Animation library
- **three-custom-shader-material** - Custom shader integration
- **react-qr-code** - QR code generation for mobile connection
- **use-haptic** - Mobile haptic feedback
- **eventemitter3** - Event system

## Application Architecture

### 1. Device Detection & Routing

The app supports two device types determined by URL parameters:

```javascript
const deviceType = new URLSearchParams(window.location.search).get("room")
  ? "mobile"
  : "desktop";
```

- **Desktop Mode**: Main game view with 3D scene
- **Mobile Mode**: Controller interface with accelerometer input

### 2. Real-time Communication Flow

#### PartyKit WebSocket Server (`/partykit/index.js`)

The server manages room-based connections:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Desktop   │ ◄─────► │  PartyKit    │ ◄─────► │   Mobile    │
│   Browser   │         │   Server     │         │   Device    │
└─────────────┘         └──────────────┘         └─────────────┘
```

**Key Features:**
- Room-based sessions with unique IDs
- Device registration (desktop/mobile)
- Real-time data broadcasting
- Connection state management

**Message Types:**
- `register`: Device joins and identifies as desktop/mobile
- `data`: Orientation/control data from mobile
- `device-joined`/`device-left`: Connection notifications

#### Client-side WebSocket Management (`usePartyKitStore.js`)

Zustand store managing WebSocket state:
- Connection status tracking
- Room ID management
- Device list synchronization
- Orientation data streaming

### 3. Mobile Controller Flow

#### Connection Process:
1. Desktop opens game → generates random room ID
2. Displays QR code with room URL
3. Mobile scans QR → joins same room
4. Mobile grants motion sensor permission
5. Begins streaming accelerometer data

#### Mobile UI Components:

**AccessScreen** → **ActiveScreen**

- **AccessScreen**: Requests motion sensor permissions
- **ActiveScreen**: 
  - Reads device orientation (alpha, beta, gamma)
  - Calibration system for zeroing orientation
  - Sends data at ~60fps (every 16ms)
  - Haptic feedback on calibration

```javascript
// Orientation data structure
{
  type: "orientation",
  alpha: normalized_yaw,    // Left-right rotation
  beta: tilt_forward,        // Forward-backward tilt
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
