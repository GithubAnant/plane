# Paper Plane Game - Complete Codebase Documentation

> A gyroscope-controlled paper plane game where you control a paper plane on your desktop by tilting your phone. Built with React Three Fiber, Rapier Physics, and PartyKit for real-time WebSocket communication.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [How Everything Connects](#how-everything-connects)
3. [Directory Structure](#directory-structure)
4. [Core Flow Explained](#core-flow-explained)
5. [File-by-File Breakdown](#file-by-file-breakdown)
   - [Entry Point & App](#entry-point--app)
   - [Experience (3D World)](#experience-3d-world)
   - [UI Components](#ui-components)
   - [Hooks (State & WebSocket)](#hooks-state--websocket)
   - [Store (Game State)](#store-game-state)
   - [Utils](#utils)
   - [PartyKit Server](#partykit-server)
   - [Public Assets](#public-assets)
   - [Styling](#styling)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DESKTOP BROWSER                                  │
│  ┌─────────────┐  ┌───────────────────────────────────────────────────────┐ │
│  │   QR Code   │  │                   React Three Fiber                    │ │
│  │  (Connect)  │  │  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐  │ │
│  └─────────────┘  │  │   Camera    │ │PlayerController│ │  Environment  │  │ │
│                   │  │ (follows)   │ │   (plane)    │ │ (obstacles)   │  │ │
│                   │  └─────────────┘ └──────────────┘ └───────────────┘  │ │
│                   │                  ▲ Gyro Data                          │ │
│                   └──────────────────┼────────────────────────────────────┘ │
│                                      │                                       │
│  ┌───────────────────────────────────┼───────────────────────────────────┐  │
│  │                        usePartyKitStore (Zustand)                      │  │
│  │   mobileData: { alpha, beta, gamma }   |   lastAction: { id: 'A' }    │  │
│  └───────────────────────────────────┼───────────────────────────────────┘  │
│                                      │                                       │
└──────────────────────────────────────┼───────────────────────────────────────┘
                                       │ WebSocket
                    ┌──────────────────┴──────────────────┐
                    │         PartyKit Server             │
                    │   (wss://fish-party.partykit.dev)   │
                    └──────────────────┬──────────────────┘
                                       │ WebSocket
┌──────────────────────────────────────┼───────────────────────────────────────┐
│                              MOBILE BROWSER                                   │
│  ┌───────────────────────────────────┼───────────────────────────────────┐  │
│  │                        usePartyKitStore (Zustand)                      │  │
│  │                      sendData({ type: 'orientation' })                 │  │
│  └───────────────────────────────────┼───────────────────────────────────┘  │
│                                      │                                       │
│  ┌─────────────────┐  ┌──────────────┴─────────────────────────────────┐   │
│  │  AccessScreen   │  │              ActiveScreen                       │   │
│  │ (Request Gyro)  │  │  - Reads device gyroscope (beta, gamma)         │   │
│  └─────────────────┘  │  - Sends data 60x/second to PartyKit            │   │
│                       │  - "A" Button: Recalibrate + Restart            │   │
│                       └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## How Everything Connects

### The Complete Data Flow

1. **User opens desktop site** → `App.jsx` detects no `?room=` param → Shows game + QR code
2. **QR code contains** → `https://yoursite.com/?room=ABC123`
3. **User scans QR on phone** → `App.jsx` detects `?room=ABC123` → Shows `MobileController`
4. **Phone requests gyro permission** → `AccessScreen.jsx` handles iOS permission API
5. **Phone streams gyro data** → `ActiveScreen.jsx` reads `deviceorientation` event every 16ms
6. **Data goes to server** → `sendData()` → WebSocket → PartyKit server
7. **Server broadcasts** → All other devices in same room receive the data
8. **Desktop receives** → `usePartyKitStore` updates `mobileData` state
9. **Plane moves** → `PlayerController.jsx` reads `mobileData` in `useFrame()` loop
10. **Collision happens** → `RigidBody.onCollisionEnter` triggers → `setGameOver()`
11. **Game Over screen** → `GameOver.jsx` shows overlay with score
12. **Restart** → Press "A" on phone OR click restart → `resetGame()` + `startGame()`

---

## Directory Structure

```
plane/
├── src/                          # Frontend source code
│   ├── main.jsx                  # Entry point - renders App
│   ├── App.jsx                   # Root component - routing + layout
│   ├── index.css                 # Global styles
│   │
│   ├── Experience/               # 3D game world (React Three Fiber)
│   │   ├── index.jsx             # Main scene setup (Physics, Camera, etc.)
│   │   ├── Camera.jsx            # Camera that follows the plane
│   │   ├── PlayerController.jsx  # The plane - physics, controls, collision
│   │   ├── Environment.jsx       # Ground, obstacles, pickups, sky
│   │   ├── Obstacle.jsx          # Single obstacle with physics + recycling
│   │   └── Pickup.jsx            # Collectible birds with bonus points
│   │
│   ├── Ui/                       # HTML/CSS UI overlays
│   │   ├── GameOver.jsx          # "GAME OVER" screen with score + restart
│   │   ├── ScoreDisplay.jsx      # Live score counter (top-left)
│   │   ├── MobileData.jsx        # QR code display (top-right)
│   │   ├── GithubLink.jsx        # GitHub icon link (bottom-right)
│   │   ├── components/
│   │   │   ├── Button.jsx        # Reusable glassmorphic button
│   │   │   └── DottedGridBackground.jsx  # Dotted pattern background
│   │   └── mobile/
│   │       ├── MobileController.jsx  # Mobile root - access vs active
│   │       ├── AccessScreen.jsx      # Request gyro permission
│   │       └── ActiveScreen.jsx      # Gyro streaming + recalibrate button
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── index.js              # Re-exports
│   │   ├── usePartyKitConnection.js  # Connect/disconnect lifecycle
│   │   └── usePartyKitStore.js       # Zustand store for WebSocket state
│   │
│   ├── store/                    # Game state management
│   │   ├── index.js              # Legacy store (mostly unused)
│   │   └── gameStore.js          # Main game state (playing, score, etc.)
│   │
│   └── utils/                    # Utility functions
│       ├── index.js              # Re-exports
│       ├── constants.js          # Event name constants
│       ├── eventBus.js           # EventEmitter3 instance
│       └── normalizeYaw.js       # Normalize yaw angle to -180 to 180
│
├── public/                       # Static assets
│   └── assets/
│       └── models/               # 3D models (.glb files)
│           ├── PLANE.glb         # The paper plane model
│           ├── long_cactus.glb   # Obstacle models
│           ├── round_cactus.glb
│           ├── weird_cactus.glb
│           ├── poly_rocks.glb
│           ├── stones_stacked.glb
│           ├── tilted_rock.glb
│           ├── yellow_bird.glb   # Pickup models
│           ├── green_bird.glb
│           ├── blue_bird.glb
│           └── red_bird.glb
│
├── partykit/                     # Real-time WebSocket server
│   └── index.js                  # PartyKit server class
│
├── partykit.json                 # PartyKit configuration
├── vite.config.js                # Vite build config
└── package.json                  # Dependencies
```

---

## Core Flow Explained

### Game States

The game uses a simple state machine managed by `gameStore.js`:

```
START → PLAYING → GAMEOVER
  ↑                   │
  └───── reset ───────┘
```

- **START**: Initial state. Waiting for phone to connect. Plane is stationary.
- **PLAYING**: Game running. Plane responds to gyro. Obstacles move. Score increases.
- **GAMEOVER**: Collision happened. Overlay shown. Waiting for restart.

### Physics System

Uses `@react-three/rapier` (Rapier physics engine):

- **PlayerController**: `RigidBody` type `dynamic` with `gravityScale={0}` (floats in air)
- **Obstacles**: `RigidBody` type `kinematicPosition` (script-controlled, not physics-based)
- **Pickups**: `RigidBody` with `sensor={true}` (triggers events, no physical collision)

### Infinite Scrolling

The world doesn't actually move forward. Instead:
1. The **plane stays at z=0**
2. **Obstacles/pickups move toward the camera** at `speed=30` units/second
3. When they pass behind the camera (z < -160), they **teleport** back to z+1250
4. **Two ground planes** alternate positions for seamless scrolling

---

## File-by-File Breakdown

---

### Entry Point & App

#### `src/main.jsx`
**What it does**: React entry point. Mounts the app.

```jsx
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <App />
)
```

- Uses `createRoot` (React 18 API)
- Renders `<App />` into the `#root` div in `index.html`

---

#### `src/App.jsx`
**What it does**: Main routing logic. Decides if desktop or mobile view.

```jsx
function App() {
  // Check URL for ?room= parameter
  const deviceType = new URLSearchParams(window.location.search).get("room")
    ? "mobile"
    : "desktop";

  usePartyKitConnection(deviceType); // Connect to WebSocket

  if (deviceType === "mobile") {
    return <MobileController />; // Phone gets the controller UI
  }

  return (
    <div className="canvas-container">
      <MobileData />       {/* QR Code */}
      <GithubLink />       {/* GitHub button */}
      <ScoreDisplay />     {/* Score counter */}
      <GameOver />         {/* Overlay when dead */}
      <Canvas>
        <Experience />     {/* 3D game world */}
      </Canvas>
    </div>
  );
}
```

**Key Logic**:
- If URL has `?room=XXX`, user is on mobile → show controller
- If no room param, user is on desktop → show game + generate room ID
- `usePartyKitConnection(deviceType)` establishes WebSocket

---

### Experience (3D World)

#### `src/Experience/index.jsx`
**What it does**: Sets up the complete 3D scene.

```jsx
export const Experience = () => {
  return (
    <>
      <color attach="background" args={["#e0c4a3"]} />
      <fog attach="fog" args={["#e8cdb0", 30, 150]} />
      
      <Suspense fallback={null}>
        <Physics gravity={[0, -40, 0]} timeStep={"vary"}>
          <PlayerController />
          <Environment />
        </Physics>
      </Suspense>
      
      <Camera/>
      <ambientLight intensity={2} />
      <directionalLight position={[10, 20, 10]} intensity={2} castShadow />
    </>
  )
};
```

**What each part does**:
- `<color>`: Sets background color
- `<fog>`: Adds atmospheric depth fog
- `<Physics>`: Rapier physics context with gravity
- `<PlayerController>`: The paper plane
- `<Environment>`: Ground, obstacles, pickups, sky
- `<Camera>`: The camera that follows the player
- Lights: Ambient + directional for shadows

---

#### `src/Experience/Camera.jsx`
**What it does**: A camera that looks at a fixed point above the plane.

```jsx
export const Camera = () => {
  const cameraLookAtRef = useRef();

  useFrame(({ camera }) => {
    if (cameraLookAtRef.current) {
      camera.lookAt(cameraLookAtRef.current.position);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      <group ref={cameraLookAtRef} position={[0, 2, 0]}></group>
      <PerspectiveCamera
        makeDefault={true}
        position={[0, 12, -20]}
        fov={65}
      />
    </>
  );
};
```

**How it works**:
- Camera sits at `[0, 12, -20]` (behind and above the plane)
- Looks at `[0, 2, 0]` (slightly above the plane's position)
- `useFrame` runs every frame to update camera direction

---

#### `src/Experience/PlayerController.jsx`
**What it does**: The paper plane with physics, gyro controls, and collision detection.

```jsx
export const PlayerController = () => {
  const plane = useGLTF("/assets/models/PLANE.glb");
  const planeRef = useRef();
  const rigidBodyRef = useRef();
  const { setGameOver, incrementScore, gameState, startGame, resetGame } = useGameStore();
  
  const calibrationRef = useRef({ beta: 0, gamma: 0 });

  // Listen for recalibrate button from phone
  useEffect(() => {
    const unsub = usePartyKitStore.subscribe((state) => state.lastAction, (action) => {
      if (action && action.id === 'A') {
        // If game over, restart
        if (useGameStore.getState().gameState === 'GAMEOVER') {
          useGameStore.getState().resetGame();
          useGameStore.getState().startGame();
        }
        // Recalibrate to current phone position
        const currentData = usePartyKitStore.getState().mobileData;
        if (currentData) {
          calibrationRef.current = { 
            beta: currentData.beta || 0, 
            gamma: currentData.gamma || 0 
          };
        }
      }
    });
    return () => unsub();
  }, []);

  // Reset physics when game starts
  useEffect(() => {
    if (gameState === 'START' || gameState === 'PLAYING') {
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      }
    }
  }, [gameState]);

  // Main game loop - runs every frame
  useFrame((state, delta) => {
    if (!planeRef.current || !rigidBodyRef.current) return;
    
    const mobileData = usePartyKitStore.getState().mobileData;
    
    if (gameState !== 'PLAYING') {
      // Auto-start when phone connects
      if (gameState === 'START' && mobileData) {
        startGame();
      }
      return;
    }
    
    if (!mobileData) return;

    // Increment score (distance)
    incrementScore(delta * 1);
    
    // Read gyro data and apply calibration
    const bVal = (mobileData.beta || 0) - calibrationRef.current.beta;
    const gVal = (mobileData.gamma || 0) - calibrationRef.current.gamma;

    // Convert to radians
    const b = THREE.MathUtils.degToRad(bVal);
    const g = THREE.MathUtils.degToRad(gVal);

    // Tilt plane based on phone orientation
    planeRef.current.rotation.z = THREE.MathUtils.clamp(g * 0.3, -Math.PI / 3, Math.PI / 3);
    planeRef.current.rotation.x = THREE.MathUtils.clamp(-b * 0.1, -Math.PI / 4, Math.PI / 4);
    
    // Calculate and apply velocity
    const xVelocity = -g * 40; // Left/right
    const yVelocity = pitchAmount * 20; // Up/down
    
    // Boundary clamping
    const currentPos = rigidBodyRef.current.translation();
    const X_LIMIT = 30;
    const Y_Min = -1;
    const Y_Max = 0;
    
    // Stop at boundaries
    let finalXVelocity = xVelocity;
    if (currentPos.x > X_LIMIT && xVelocity > 0) finalXVelocity = 0;
    if (currentPos.x < -X_LIMIT && xVelocity < 0) finalXVelocity = 0;

    rigidBodyRef.current.setLinvel({ x: finalXVelocity, y: finalYVelocity, z: 0 }, true);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic" 
      gravityScale={0}
      colliders="cuboid"
      position={[0, 1, 0]}
      scale={[0.5, 0.5, 0.5]}
      onCollisionEnter={({ other }) => {
        if (gameState === 'PLAYING') {
          setGameOver(); // GAME OVER on collision
        }
      }}
    >
      <group ref={planeRef}>
        <primitive object={plane.scene} />
      </group>
    </RigidBody>
  );
};
```

**Key Concepts**:
- **Calibration**: Stores the phone's current orientation as "neutral". All future readings are relative to this.
- **Boundary clamping**: Prevents plane from flying off screen
- **onCollisionEnter**: Triggers game over when hitting obstacles
- **Physics body**: `dynamic` type but `gravityScale={0}` means it floats

---

#### `src/Experience/Environment.jsx`
**What it does**: The entire game world - ground, obstacles, pickups, sky.

```jsx
export const Environment = () => {
  // Load all 3D models
  const longCactus = useGLTF("./assets/models/long_cactus.glb");
  const roundCactus = useGLTF("./assets/models/round_cactus.glb");
  // ... more models ...

  const groundRef = useRef();
  const groundRef2 = useRef();
  const speed = 30;

  const gameState = useGameStore((state) => state.gameState);

  // Infinite ground scrolling
  useFrame((state, delta) => {
    if (gameState !== 'PLAYING') return;

    if (groundRef.current) {
      groundRef.current.position.z -= speed * delta;
      if (groundRef.current.position.z < -200) {
        groundRef.current.position.z += 800; // Reset behind
      }
    }
    // Same for groundRef2
  });

  // Generate 50 obstacles and 17 pickups at startup
  const { obstacles, pickups } = useMemo(() => {
    const obs = [];
    const picks = [];
    
    for(let i=0; i<50; i++) {
      // Random obstacle type
      const type = Math.floor(Math.random() * 6);
      const zPos = 200 + (i * 25); // Spaced 25 units apart
      const xPos = (Math.random() * 56 - 28); // Random X position
      
      obs.push({
        id: i,
        model: models[type].m,
        pos: [xPos, yOffset, zPos],
        scale: models[type].s
      });
      
      // Pickup every 3rd obstacle
      if (i % 3 === 0) {
        picks.push({
          id: i,
          model: birdModels[randomType],
          pos: [randomX, randomY, zPos + 20],
          scale: 0.5
        });
      }
    }
    return { obstacles: obs, pickups: picks };
  }, []);

  return (
    <group>
      <DreiEnvironment preset="sunset" />
      
      {/* Two ground planes for infinite scrolling */}
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#e8b88a" />
      </mesh>
      <mesh ref={groundRef2} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 400]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#e8b88a" />
      </mesh>
      
      {/* Render all obstacles */}
      {obstacles.map(o => (
        <Obstacle key={o.id} model={o.model} initialPosition={o.pos} scale={o.scale} />
      ))}

      {/* Render all pickups */}
      {pickups.map(p => (
        <Pickup key={p.id} model={p.model} initialPosition={p.pos} scale={p.scale} />
      ))}
      
      {/* Clouds */}
      <Cloud position={[-4, 20, -20]} speed={0.2} opacity={0.5} />
    </group>
  );
};
```

**Key Concepts**:
- **Infinite scrolling**: Two ground planes swap positions
- **Obstacle generation**: `useMemo` creates obstacles once at render, not every frame
- **Pickup frequency**: Every 3rd obstacle has a bird pickup nearby

---

#### `src/Experience/Obstacle.jsx`
**What it does**: A single obstacle that moves toward the player and recycles.

```jsx
export const Obstacle = ({ model, initialPosition, scale }) => {
  const rigidBodyRef = useRef();
  const speed = 30;
  const gameState = useGameStore((state) => state.gameState);

  // Reset position when game restarts
  useEffect(() => {
    if (gameState === 'START' && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(
        { x: initialPosition[0], y: initialPosition[1], z: initialPosition[2] },
        true
      );
    }
  }, [gameState]);
  
  // Move obstacle every frame
  useFrame((state, delta) => {
    if (gameState !== 'PLAYING') return;
    if (!rigidBodyRef.current) return;

    const currentPos = rigidBodyRef.current.translation();
    const newZ = currentPos.z - speed * delta;

    // When past camera, teleport back to front
    if (newZ < -160) {
      rigidBodyRef.current.setTranslation(
        { x: initialPosition[0], y: initialPosition[1], z: newZ + 1250 },
        true
      );
    } else {
      rigidBodyRef.current.setTranslation(
        { x: currentPos.x, y: currentPos.y, z: newZ },
        true
      );
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="cuboid"
      position={initialPosition}
    >
      <primitive object={model.clone()} scale={scale} />
    </RigidBody>
  );
};
```

**Key Concepts**:
- `type="kinematicPosition"`: Physics body controlled by script, not physics
- **Recycling**: Teleports 1250 units forward when behind camera (50 obstacles × 25 spacing)

---

#### `src/Experience/Pickup.jsx`
**What it does**: Collectible birds that give bonus points.

```jsx
export const Pickup = ({ model, initialPosition, scale }) => {
  const rigidBodyRef = useRef();
  const [active, setActive] = useState(true);
  const incrementScore = useGameStore((state) => state.incrementScore);

  // Reset on game start
  useEffect(() => {
    if (gameState === 'START' && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({...initialPosition}, true);
      setActive(true);
    }
  }, [gameState]);

  useFrame((state, delta) => {
    // Move forward + rotate for visual flair
    if (active) {
      rigidBodyRef.current.setRotation(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, state.clock.elapsedTime * 2, 0)),
        true
      );
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="hull"
      sensor // Detects intersection without physical collision
      onIntersectionEnter={({ other }) => {
        if (active && gameState === 'PLAYING') {
          incrementScore(50); // +50 bonus points
          setActive(false);
          rigidBodyRef.current.setTranslation({x: 0, y: -100, z: 0}, true); // Hide
        }
      }}
    >
      <primitive object={model.clone()} scale={scale} />
    </RigidBody>
  );
};
```

**Key Concepts**:
- `sensor={true}`: Triggers `onIntersectionEnter` without blocking movement
- **Rotation animation**: Birds spin continuously
- **Deactivation**: Hides when collected, reactivates when recycled

---

### UI Components

#### `src/Ui/GameOver.jsx`
**What it does**: Full-screen game over overlay with score and restart button.

```jsx
export const GameOver = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const score = useGameStore((state) => state.score);

  if (!isGameOver) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "rgba(0, 0, 0, 0.8)", color: "white", zIndex: 9999,
    }}>
      <h1>GAME OVER</h1>
      <p>Distance: {Math.floor(score)}m</p>
      
      <button onClick={() => {
        const state = useGameStore.getState();
        state.resetGame();
      }}>
        RESTART
      </button>
    </div>
  );
};
```

---

#### `src/Ui/ScoreDisplay.jsx`
**What it does**: Shows current score in top-left corner.

```jsx
export const ScoreDisplay = () => {
  const score = useGameStore((state) => state.score);
  const isGameOver = useGameStore((state) => state.isGameOver);

  if (isGameOver) return null;

  return (
    <div style={{ position: "fixed", top: "40px", left: "40px", fontSize: "48px" }}>
      {Math.floor(score)}m
    </div>
  );
};
```

---

#### `src/Ui/MobileData.jsx`
**What it does**: Displays QR code for phone to scan.

```jsx
export const MobileData = () => {
  const roomId = usePartyKitStore((state) => state.room);
  const baseUrl = window.location.origin;
  
  return (
    <>
      {roomId && (
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
          <QRCode value={`${baseUrl}/?room=${roomId}`} size={150} />
        </div>
      )}
    </>
  );
};
```

**How it works**:
- `roomId` is generated when desktop connects
- QR contains: `https://yoursite.com/?room=ABC123`
- Phone scans → opens same URL → joins same room

---

#### `src/Ui/GithubLink.jsx`
**What it does**: Animated GitHub icon link in bottom-right corner.

Features fancy hover effects with CSS-in-JS for glassmorphic look.

---

#### `src/Ui/components/Button.jsx`
**What it does**: Reusable glassmorphic button component.

```jsx
export const Button = ({ label = 'Generate', onClick, className }) => {
  return (
    <div className={`button-wrap ${className}`}>
      <div className="button-shadow"></div>
      <button onClick={onClick} onTouchStart={onClick}>
        <span>{label}</span>
      </button>
    </div>
  );
}
```

Used by mobile screens for "Request Access" and "A" button.

---

#### `src/Ui/components/DottedGridBackground.jsx`
**What it does**: Creates a dotted pattern background using SVG.

Used as the background for the mobile controller screens.

---

#### `src/Ui/mobile/MobileController.jsx`
**What it does**: Root component for mobile view. Shows either access request or active controller.

```jsx
export const MobileController = () => {
  const [accessGranted, setAccessGranted] = useState(false);
  
  return (
    <DottedGridBackground>
      {accessGranted ? (
        <ActiveScreen />
      ) : (
        <AccessScreen setAccessGranted={setAccessGranted} />
      )}
    </DottedGridBackground>
  );
};
```

---

#### `src/Ui/mobile/AccessScreen.jsx`
**What it does**: Requests permission for gyroscope access (required on iOS 13+).

```jsx
export const AccessScreen = ({ setAccessGranted }) => {
  const { triggerHaptic } = useHaptic();

  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === "granted") {
        return true;
      }
    }
    return true; // Non-iOS devices don't need permission
  };

  const handleActivate = async () => {
    triggerHaptic(); // Vibrate phone
    const granted = await requestPermission();
    if (granted) {
      setAccessGranted(true);
    }
  };

  return (
    <>
      <p>Please allow access to your device's accelerometer...</p>
      <Button label="Request Access" onClick={handleActivate} />
    </>
  );
};
```

**Why this is needed**:
- iOS 13+ requires explicit user gesture to access gyroscope
- Must call `DeviceOrientationEvent.requestPermission()` after button click

---

#### `src/Ui/mobile/ActiveScreen.jsx`
**What it does**: Streams gyroscope data to the desktop and provides recalibrate button.

```jsx
export const ActiveScreen = () => {
  const calibrationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const latestOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const sendData = usePartyKitStore((state) => state.sendData);

  const handleOrientation = (event) => {
    latestOrientation.current = {
      alpha: normalizeYaw(event.alpha || 0),
      beta: event.beta || 0,
      gamma: event.gamma || 0,
    };
  };

  const handleRecalibrate = () => {
    calibrationRef.current = { ...latestOrientation.current };
    sendData({ type: 'button', id: 'A' }); // Tell desktop to recalibrate/restart
  };

  useEffect(() => {
    // Listen for gyroscope changes
    window.addEventListener("deviceorientation", handleOrientation);

    // Send calibrated data every 16ms (60fps)
    const interval = setInterval(() => {
      const raw = latestOrientation.current;
      const calibration = calibrationRef.current;

      const calibrated = {
        alpha: normalizeYaw(raw.alpha - calibration.alpha),
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
  }, [sendData]);

  return (
    <>
      <Button label="A" className="A-button" onClick={handleRecalibrate} />
      <p>Tap the A button to recalibrate.</p>
    </>
  );
};
```

**Key Concepts**:
- **Calibration**: When user hits "A", current orientation becomes zero
- **60fps streaming**: Sends data every 16ms via WebSocket
- **Two data types**: 
  - `{ type: 'orientation', beta, gamma }` - movement data
  - `{ type: 'button', id: 'A' }` - button press

---

### Hooks (State & WebSocket)

#### `src/hooks/usePartyKitConnection.js`
**What it does**: Lifecycle hook to connect/disconnect from PartyKit server.

```jsx
export function usePartyKitConnection(deviceType = "desktop") {
  const connect = usePartyKitStore((state) => state.connect);
  const disconnect = usePartyKitStore((state) => state.disconnect);

  useEffect(() => {
    connect(deviceType);
    return () => disconnect();
  }, [deviceType, connect, disconnect]);
}
```

Called once in `App.jsx` to establish connection.

---

#### `src/hooks/usePartyKitStore.js`
**What it does**: Zustand store managing WebSocket connection and data.

```jsx
export const usePartyKitStore = create((set, get) => ({
  status: 'disconnected',
  devices: [],
  ws: null,
  room: null,
  mobileData: null,     // Gyroscope data from phone
  lastAction: null,      // Last button press

  connect: (deviceType = 'desktop') => {
    // Generate or use existing room ID
    const urlRoom = new URLSearchParams(window.location.search).get("room");
    const roomId = urlRoom ? urlRoom : Math.random().toString(36).substring(2, 10);
    
    set({ room: roomId });

    const ws = new WebSocket(`wss://fish-party.githubanant.partykit.dev/party/${roomId}`);

    ws.onopen = () => {
      set({ status: 'connected' });
      ws.send(JSON.stringify({ type: 'register', deviceType }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'data') {
        if (data.payload?.type === 'orientation') {
          set({ mobileData: data.payload }); // Update gyro data
        }
        else if (data.payload?.type === 'button') {
          set({ lastAction: data.payload }); // Update button state
        }
      }
    };

    set({ ws });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) ws.close();
    set({ ws: null, status: 'disconnected' });
  },

  sendData: (payload) => {
    const { ws } = get();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'data', payload }));
    }
  },
}));
```

**State Properties**:
- `room`: The room ID shared between desktop and phone
- `mobileData`: Latest `{ alpha, beta, gamma }` from phone
- `lastAction`: Latest `{ type: 'button', id: 'A' }` from phone
- `sendData()`: Function to send data to server (used by phone)

---

### Store (Game State)

#### `src/store/gameStore.js`
**What it does**: Manages game state using Zustand.

```jsx
export const useGameStore = create((set) => ({
  gameState: 'START', // START, PLAYING, GAMEOVER
  score: 0,
  isGameOver: false,
  
  startGame: () => set({ 
    gameState: 'PLAYING', 
    score: 0, 
    isGameOver: false 
  }),
  
  setGameOver: () => set({ 
    gameState: 'GAMEOVER', 
    isGameOver: true 
  }),
  
  incrementScore: (amount) => set((state) => ({ 
    score: state.score + amount 
  })),
  
  resetGame: () => set({ 
    gameState: 'START', 
    score: 0, 
    isGameOver: false 
  }),
}));
```

**State Properties**:
- `gameState`: `'START'` | `'PLAYING'` | `'GAMEOVER'`
- `score`: Number (distance in meters + bonus from pickups)
- `isGameOver`: Boolean (for UI to know when to show overlay)

---

#### `src/store/index.js`
**What it does**: Legacy store (mostly unused now).

```jsx
export const useStore = create((set) => ({
  mobileData: null,
  setMobileData: (data) => set({ mobileData: data }),
  // ... other legacy properties
}))
```

Originally used for gyro data, now superseded by `usePartyKitStore`.

---

### Utils

#### `src/utils/constants.js`
**What it does**: Event name constants for the event bus.

```jsx
export const EVENTS = {
  PARTICLES: {
    BUBBLE: { EMIT: "PARTICLES_BUBBLE_EMIT" },
    WAVE: { EMIT: "PARTICLES_WAVE_EMIT" },
  }
}
```

Currently unused (from older version of the game).

---

#### `src/utils/eventBus.js`
**What it does**: Shared event emitter instance.

```jsx
import EventEmitter from "eventemitter3";
export const eventBus = new EventEmitter();
```

Can be used for cross-component communication without props.

---

#### `src/utils/normalizeYaw.js`
**What it does**: Normalizes yaw angle to -180 to 180 range.

```jsx
export const normalizeYaw = (yaw) => {
  if (yaw > 180) return yaw - 360;
  return yaw;
};
```

Prevents issues when yaw crosses 360°/0° boundary.

---

### PartyKit Server

#### `partykit/index.js`
**What it does**: Real-time WebSocket server for device communication.

```jsx
class PartyServer {
  constructor(room) {
    this.room = room;
    this.devices = new Map();
  }

  onConnect(conn, ctx) {
    // Send room info to new connection
    conn.send(JSON.stringify({
      type: "connected",
      connectionId: conn.id,
      roomId: this.room.id,
      connectedDevices: Array.from(this.devices.keys()),
    }));
  }

  onMessage(message, sender) {
    const data = JSON.parse(message);

    switch (data.type) {
      case "register":
        // Store device info
        this.devices.set(sender.id, {
          deviceType: data.deviceType,
          timestamp: Date.now(),
        });
        // Notify everyone
        this.room.broadcast(JSON.stringify({
          type: "device-joined",
          deviceType: data.deviceType,
          connectedDevices: Array.from(this.devices.entries()),
        }));
        break;

      case "data":
        // Forward to all OTHER devices (not sender)
        this.room.broadcast(
          JSON.stringify({
            type: "data",
            from: sender.id,
            payload: data.payload,
          }),
          [sender.id] // Exclude sender
        );
        break;
    }
  }

  onClose(conn) {
    this.devices.delete(conn.id);
    this.room.broadcast(JSON.stringify({
      type: "device-left",
      connectedDevices: Array.from(this.devices.entries()),
    }));
  }
}

export default PartyServer;
```

**How it works**:
1. Each room has its own server instance
2. Devices connect with WebSocket
3. `register` message stores device type (desktop/mobile)
4. `data` messages are broadcast to all OTHER devices
5. When connection closes, other devices are notified

**Message Types**:
- `connected`: Sent to new connections with room info
- `device-joined`: Broadcast when device registers
- `device-left`: Broadcast when device disconnects
- `data`: Forwarded payload (orientation or button)

---

### Public Assets

#### `public/assets/models/`
Contains 3D models in `.glb` format (GLTF binary):

| Model | Description |
|-------|-------------|
| `PLANE.glb` | The paper plane (player) |
| `long_cactus.glb` | Tall cactus obstacle |
| `round_cactus.glb` | Round cactus obstacle |
| `weird_cactus.glb` | Unusual cactus obstacle |
| `poly_rocks.glb` | Low-poly rocks |
| `stones_stacked.glb` | Stacked stones |
| `tilted_rock.glb` | Large tilted rock (background) |
| `yellow_bird.glb` | Yellow bird pickup |
| `green_bird.glb` | Green bird pickup |
| `blue_bird.glb` | Blue bird pickup |
| `red_bird.glb` | Red bird pickup |

---

### Styling

#### `src/index.css`
**What it does**: Global styles including the glassmorphic button design.

Key sections:
1. **Reset**: `* { margin: 0; padding: 0; user-select: none; }`
2. **Canvas container**: Full viewport fixed positioning
3. **Button styling**: Complex glassmorphic effect with:
   - Gradient backgrounds
   - Box shadows (multiple layers)
   - Backdrop filter blur
   - Animated border with conic gradient
   - `:active` state transitions
4. **A-button**: Circular variant for mobile recalibrate
5. **Container**: Flexbox centering for mobile screens

---

## Summary

This game is a clever use of modern web technologies:

1. **React Three Fiber** - 3D rendering with React paradigm
2. **Rapier Physics** - Real-time collision detection
3. **Zustand** - Simple but powerful state management
4. **PartyKit** - Zero-config real-time WebSocket rooms
5. **Device Orientation API** - Native gyroscope access

The architecture separates concerns well:
- **Experience/** handles all 3D/physics logic
- **Ui/** handles all 2D overlays
- **hooks/** manages WebSocket connection
- **store/** manages game state
- **partykit/** handles server-side message routing

The infinite scrolling system is elegant - instead of moving the player forward, the world moves backward, with objects recycling when they pass behind the camera.
