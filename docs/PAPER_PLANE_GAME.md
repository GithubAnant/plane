# ✈️ Paper Plane Game - Complete Implementation Guide

> **From Fishing Game to Paper Plane in 2 Hours**

This guide shows you exactly how to build a gyroscope-controlled paper plane game using your existing fishing game codebase.

---

## 📋 What You're Building

**Gameplay**:
- Desktop shows 3D sky world with plane flying
- Tilt phone left/right → plane banks and turns
- Tilt forward/back → plane climbs/dives
- Collect golden stars for points
- Avoid obstacles (trees, buildings, clouds)
- Crash into ground/obstacles → game over
- Track score and distance flown

**Feel**: Relaxing, flow-state, beautiful visuals

---

## 🎯 Architecture Overview

### Reusing from Fishing Game:
- ✅ PartyKit WebSocket (already deployed)
- ✅ Mobile gyroscope controller (already working)
- ✅ Desktop 3D canvas (just change the scene)
- ✅ State management with Zustand

### New Components:
- 🆕 Plane physics & controls
- 🆕 Environment (sky, ground, clouds)
- 🆕 Obstacles system
- 🆕 Collectibles system
- 🆕 Game state (score, alive, distance)
- 🆕 Crash detection & restart

---

## 🚀 Step-by-Step Implementation

### Step 1: Create Game State Store

**File**: `src/store/gameStore.js`

```javascript
import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Game state
  isAlive: true,
  isPaused: false,
  score: 0,
  distance: 0,
  highScore: parseInt(localStorage.getItem('planeHighScore')) || 0,
  
  // Actions
  crash: () => {
    const { score, highScore } = get();
    if (score > highScore) {
      localStorage.setItem('planeHighScore', score.toString());
      set({ highScore: score });
    }
    set({ isAlive: false });
  },
  
  addScore: (points) => {
    set((state) => ({ 
      score: state.score + points 
    }));
  },
  
  addDistance: (dist) => {
    set((state) => ({ 
      distance: state.distance + dist 
    }));
  },
  
  restart: () => {
    set({ 
      isAlive: true, 
      score: 0, 
      distance: 0,
      isPaused: false
    });
  },
  
  togglePause: () => {
    set((state) => ({ 
      isPaused: !state.isPaused 
    }));
  }
}));
```

---

### Step 2: Create the Plane Component

**File**: `src/Experience/Plane.jsx`

```javascript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { usePartyKitStore } from '@/hooks/usePartyKitStore';
import { useGameStore } from '@/store/gameStore';

export const Plane = () => {
  const groupRef = useRef();
  const rbRef = useRef();
  
  const isAlive = useGameStore((state) => state.isAlive);
  const isPaused = useGameStore((state) => state.isPaused);
  const crash = useGameStore((state) => state.crash);
  const addDistance = useGameStore((state) => state.addDistance);
  
  // Plane settings
  const speed = 8;
  const sensitivity = 0.05;
  const smoothness = 5;

  useFrame((state, delta) => {
    if (!isAlive || isPaused || !groupRef.current || !rbRef.current) return;

    // Get mobile gyroscope data
    const mobileData = usePartyKitStore.getState().mobileData;
    if (!mobileData) return;

    const { beta, gamma } = mobileData;
    
    // Convert to radians
    const pitch = THREE.MathUtils.degToRad(beta) * sensitivity;
    const roll = THREE.MathUtils.degToRad(gamma) * sensitivity;

    // Smooth rotation (lerp = linear interpolation)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      pitch,
      delta * smoothness
    );
    
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      -roll,
      delta * smoothness
    );

    // Calculate forward direction based on rotation
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(groupRef.current.quaternion);
    
    // Apply velocity
    const velocity = forward.multiplyScalar(speed);
    rbRef.current.setLinvel(velocity, true);

    // Track distance
    addDistance(speed * delta);
  });

  // Collision handler
  const handleCollision = ({ other }) => {
    const tag = other.rigidBodyObject?.userData?.tag;
    
    if (tag === 'obstacle' || tag === 'ground') {
      crash();
    }
  };

  return (
    <RigidBody
      ref={rbRef}
      position={[0, 2, 0]}
      colliders="hull"
      type="kinematicVelocity"
      onCollisionEnter={handleCollision}
    >
      <group ref={groupRef}>
        {/* Main body (triangle) */}
        <mesh castShadow>
          <coneGeometry args={[0.3, 1, 3]} />
          <meshStandardMaterial 
            color="#ffffff"
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
        
        {/* Right wing */}
        <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[1, 0.02, 0.5]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>
        
        {/* Left wing */}
        <mesh position={[-0.6, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[1, 0.02, 0.5]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>

        {/* Tail */}
        <mesh position={[0, 0.2, 0.4]} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.4, 0.02, 0.3]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
      </group>
    </RigidBody>
  );
};
```

---

### Step 3: Create Environment

**File**: `src/Experience/Environment.jsx`

```javascript
import { RigidBody } from '@react-three/rapier';
import { Sky, Cloud } from '@react-three/drei';

export const Environment = () => {
  return (
    <>
      {/* Beautiful sky */}
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0.6}
        azimuth={0.25}
      />

      {/* Ambient fog */}
      <fog attach="fog" args={['#87CEEB', 50, 200]} />

      {/* Ground plane (crash if you hit it) */}
      <RigidBody 
        type="fixed" 
        colliders="cuboid"
        userData={{ tag: 'ground' }}
      >
        <mesh position={[0, -5, 0]} receiveShadow>
          <boxGeometry args={[500, 0.1, 500]} />
          <meshStandardMaterial color="#7EC850" />
        </mesh>
      </RigidBody>

      {/* Decorative clouds (non-collidable) */}
      <FloatingClouds />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
    </>
  );
};

const FloatingClouds = () => {
  const clouds = [
    { pos: [10, 5, -30], scale: 8 },
    { pos: [-15, 8, -50], scale: 12 },
    { pos: [20, 3, -80], scale: 10 },
    { pos: [-8, 6, -100], scale: 9 },
    { pos: [5, 10, -120], scale: 15 },
  ];

  return (
    <>
      {clouds.map((cloud, i) => (
        <Cloud
          key={i}
          position={cloud.pos}
          speed={0.1}
          opacity={0.5}
          width={cloud.scale}
          depth={cloud.scale / 2}
          segments={20}
        />
      ))}
    </>
  );
};
```

---

### Step 4: Create Obstacles

**File**: `src/Experience/Obstacles.jsx`

```javascript
import { RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';

export const Obstacles = () => {
  // Generate random obstacles
  const obstacles = useMemo(() => {
    const obs = [];
    for (let i = 0; i < 20; i++) {
      obs.push({
        id: i,
        type: Math.random() > 0.5 ? 'tree' : 'building',
        position: [
          (Math.random() - 0.5) * 30, // X: -15 to 15
          Math.random() * 5 + 1,       // Y: 1 to 6
          -30 - i * 15                 // Z: spread out
        ]
      });
    }
    return obs;
  }, []);

  return (
    <>
      {obstacles.map((obs) => (
        <Obstacle
          key={obs.id}
          type={obs.type}
          position={obs.position}
        />
      ))}
    </>
  );
};

const Obstacle = ({ type, position }) => {
  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      position={position}
      userData={{ tag: 'obstacle' }}
    >
      {type === 'tree' && <Tree />}
      {type === 'building' && <Building />}
    </RigidBody>
  );
};

const Tree = () => (
  <group>
    {/* Trunk */}
    <mesh position={[0, 0, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.3, 3]} />
      <meshStandardMaterial color="#8B4513" />
    </mesh>
    {/* Leaves */}
    <mesh position={[0, 2, 0]} castShadow>
      <sphereGeometry args={[1.2]} />
      <meshStandardMaterial color="#228B22" />
    </mesh>
  </group>
);

const Building = () => (
  <mesh castShadow>
    <boxGeometry args={[2, 6, 2]} />
    <meshStandardMaterial color="#808080" />
  </mesh>
);
```

---

### Step 5: Create Collectibles

**File**: `src/Experience/Collectibles.jsx`

```javascript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '@/store/gameStore';

export const Collectibles = () => {
  // Generate star positions
  const stars = useMemo(() => {
    const items = [];
    for (let i = 0; i < 30; i++) {
      items.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 20, // X: -10 to 10
          Math.random() * 8 + 2,       // Y: 2 to 10
          -20 - i * 10                 // Z: spread out
        ]
      });
    }
    return items;
  }, []);

  return (
    <>
      {stars.map((star) => (
        <Star key={star.id} position={star.position} />
      ))}
    </>
  );
};

const Star = ({ position }) => {
  const meshRef = useRef();
  const rbRef = useRef();
  const collected = useRef(false);

  // Rotate and bob up/down
  useFrame((state) => {
    if (!meshRef.current || collected.current) return;
    
    meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
  });

  const handleCollision = () => {
    if (collected.current) return;
    
    collected.current = true;
    useGameStore.getState().addScore(10);
    
    // Hide the star
    if (rbRef.current) {
      rbRef.current.setEnabled(false);
    }
    if (meshRef.current) {
      meshRef.current.visible = false;
    }
  };

  return (
    <RigidBody
      ref={rbRef}
      type="fixed"
      position={position}
      sensor
      onIntersectionEnter={handleCollision}
      userData={{ tag: 'collectible' }}
    >
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[0.4]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </RigidBody>
  );
};
```

---

### Step 6: Main Game Scene

**File**: `src/Experience/PlaneGame.jsx`

```javascript
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { Plane } from './Plane';
import { Environment } from './Environment';
import { Obstacles } from './Obstacles';
import { Collectibles } from './Collectibles';
import { Camera } from './Camera';

export const PlaneGame = () => {
  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.8, 0]}>
          <Environment />
          <Plane />
          <Obstacles />
          <Collectibles />
        </Physics>
      </Suspense>

      <Camera />
    </>
  );
};
```

---

### Step 7: Camera Following Plane

**File**: `src/Experience/Camera.jsx`

```javascript
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export const Camera = () => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 5, 10));

  useFrame(() => {
    // Camera follows behind and above the plane
    const idealPosition = new THREE.Vector3(0, 5, 10);
    
    // Smooth camera movement
    targetPosition.current.lerp(idealPosition, 0.1);
    camera.position.copy(targetPosition.current);
    
    // Look at plane position
    camera.lookAt(0, 2, 0);
  });

  return null;
};
```

---

### Step 8: Game HUD

**File**: `src/Ui/GameHUD.jsx`

```javascript
import { useGameStore } from '@/store/gameStore';

export const GameHUD = () => {
  const score = useGameStore((state) => state.score);
  const distance = useGameStore((state) => state.distance);
  const isAlive = useGameStore((state) => state.isAlive);

  if (!isAlive) return null;

  return (
    <div style={styles.hud}>
      <div style={styles.stat}>
        <span style={styles.label}>⭐ SCORE</span>
        <span style={styles.value}>{score}</span>
      </div>
      <div style={styles.stat}>
        <span style={styles.label}>📏 DISTANCE</span>
        <span style={styles.value}>{distance.toFixed(0)}m</span>
      </div>
    </div>
  );
};

const styles = {
  hud: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    fontFamily: 'Arial, sans-serif'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.7)',
    padding: '12px 24px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.1)'
  },
  label: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: '1px'
  },
  value: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fff',
    marginTop: '4px'
  }
};
```

---

### Step 9: Game Over Screen

**File**: `src/Ui/GameOver.jsx`

```javascript
import { useGameStore } from '@/store/gameStore';

export const GameOver = () => {
  const isAlive = useGameStore((state) => state.isAlive);
  const score = useGameStore((state) => state.score);
  const distance = useGameStore((state) => state.distance);
  const highScore = useGameStore((state) => state.highScore);
  const restart = useGameStore((state) => state.restart);

  if (isAlive) return null;

  const isNewHighScore = score === highScore && score > 0;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h1 style={styles.title}>💥 CRASHED!</h1>
        
        {isNewHighScore && (
          <div style={styles.badge}>🏆 NEW HIGH SCORE!</div>
        )}

        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Score</span>
            <span style={styles.statValue}>{score}</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Distance</span>
            <span style={styles.statValue}>{distance.toFixed(0)}m</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>High Score</span>
            <span style={styles.statValue}>{highScore}</span>
          </div>
        </div>

        <button onClick={restart} style={styles.button}>
          🔄 Try Again
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)'
  },
  card: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px',
    borderRadius: '24px',
    textAlign: 'center',
    minWidth: '400px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    color: 'white'
  },
  title: {
    fontSize: '42px',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  badge: {
    display: 'inline-block',
    background: '#FFD700',
    color: '#000',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '20px',
    animation: 'pulse 1s infinite'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '30px'
  },
  statBox: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '15px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)'
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    opacity: 0.8,
    marginBottom: '5px'
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  button: {
    padding: '16px 48px',
    fontSize: '20px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease'
  }
};
```

---

### Step 10: Update Main App

**File**: `src/App.jsx`

```javascript
import { Canvas } from "@react-three/fiber";
import { MobileData } from "./Ui/MobileData";
import { MobileController } from "./Ui/mobile/MobileController";
import { PlaneGame } from "./Experience/PlaneGame";
import { usePartyKitConnection } from "./hooks";
import { GithubLink } from "./Ui/GithubLink";
import { GameHUD } from "./Ui/GameHUD";
import { GameOver } from "./Ui/GameOver";

function App() {
  const deviceType = new URLSearchParams(window.location.search).get("room")
    ? "mobile"
    : "desktop";

  usePartyKitConnection(deviceType);
  
  if (deviceType === "mobile") {
    return <MobileController />;
  }
  
  return (
    <div className="canvas-container">
      <MobileData />
      <GithubLink />
      <GameHUD />
      <GameOver />
      <Canvas
        camera={{ position: [0, 5, 10], fov: 60 }}
        shadows
      >
        <PlaneGame />
      </Canvas>
    </div>
  );
}

export default App;
```

---

## 🎨 Visual Enhancements (Optional)

### Add Particle Trail Behind Plane

**File**: `src/Experience/PlaneTrail.jsx`

```javascript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const PlaneTrail = ({ planePosition }) => {
  const trailRef = useRef();
  const points = useRef([]);
  const maxPoints = 50;

  useFrame(() => {
    if (!planePosition || !trailRef.current) return;

    // Add current position
    points.current.push(planePosition.clone());
    
    // Keep only last N points
    if (points.current.length > maxPoints) {
      points.current.shift();
    }

    // Update line geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points.current);
    trailRef.current.geometry = geometry;
  });

  return (
    <line ref={trailRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#ffffff" opacity={0.5} transparent />
    </line>
  );
};
```

### Add Crash Effect

**File**: `src/Experience/CrashEffect.jsx`

```javascript
import { useEffect } from 'react';
import gsap from 'gsap';

export const CrashEffect = ({ position, onComplete }) => {
  useEffect(() => {
    // Camera shake
    gsap.to(camera.position, {
      x: '+=0.5',
      y: '+=0.5',
      duration: 0.1,
      yoyo: true,
      repeat: 5,
      onComplete
    });
  }, []);

  return (
    <mesh position={position}>
      <sphereGeometry args={[2]} />
      <meshBasicMaterial color="orange" transparent opacity={0.5} />
    </mesh>
  );
};
```

---

## 🎮 Controls Summary

### Mobile (Controller):
- **Tilt Left/Right** → Plane rolls
- **Tilt Forward/Back** → Plane pitches
- **Tap Calibrate** → Reset zero point

### Desktop (Display):
- Shows 3D world
- Displays score/distance
- Shows game over screen

---

## 🐛 Testing Checklist

- [ ] Phone connects to desktop via QR code
- [ ] Tilting phone moves plane
- [ ] Plane crashes on ground contact
- [ ] Plane crashes on obstacle contact
- [ ] Collecting stars adds score
- [ ] Distance increases over time
- [ ] Game over screen appears on crash
- [ ] Restart button works
- [ ] High score persists in localStorage

---

## 🚀 Deployment

### 1. PartyKit (Already Deployed)
Your WebSocket server is already live at:
```
wss://fish-party.githubanant.partykit.dev
```

No changes needed! The same server handles both games.

### 2. Deploy Frontend to Vercel

```bash
# Build the game
npm run build

# Deploy
vercel

# Your game is live!
# https://your-game.vercel.app
```

---

## 🎯 Next Steps

### Easy Enhancements:
1. **Different plane skins** - Let users choose colors
2. **Power-ups** - Speed boost, invincibility
3. **Day/night cycle** - Sky changes color over time
4. **Sound effects** - Whoosh, collect, crash sounds

### Medium Enhancements:
1. **Procedural obstacles** - Generate infinitely
2. **Difficulty curve** - Speed increases over time
3. **Leaderboard** - PartyKit can store top scores
4. **Multiplayer** - See other players' planes

### Advanced Enhancements:
1. **AI opponents** - Planes that fly patterns
2. **Custom maps** - Different environments
3. **Tricks system** - Loop-the-loops for bonus points
4. **Replay system** - Watch your best runs

---

## 📚 Key Concepts Explained

### Collision Detection

```javascript
<RigidBody
  onCollisionEnter={({ other }) => {
    const tag = other.rigidBodyObject?.userData?.tag;
    if (tag === 'obstacle') {
      // Crash!
    }
  }}
>
```

**How it works**:
1. Rapier physics detects when objects touch
2. `userData.tag` identifies what was hit
3. You decide what happens (crash, collect, bounce)

### Kinematic vs Fixed Bodies

```javascript
// Plane = kinematicVelocity (you control velocity)
<RigidBody type="kinematicVelocity">

// Obstacles = fixed (never moves)
<RigidBody type="fixed">

// Collectibles = fixed + sensor (no collision force)
<RigidBody type="fixed" sensor>
```

### Sensors

```javascript
<RigidBody sensor onIntersectionEnter={collect}>
```

**Sensor = ghost collision**:
- Detects when something enters
- But doesn't push/block objects
- Perfect for collectibles!

---

## 💡 Pro Tips

1. **Test with low sensitivity first** - Start with `sensitivity = 0.01`, then increase
2. **Use lerp for smoothness** - Direct assignment = jittery, lerp = smooth
3. **Add debug mode** - Show collision boxes during development
4. **Mobile HTTPS required** - Use ngrok locally, Vercel for production
5. **Start simple** - Get plane flying first, add obstacles later

---

## 🆘 Troubleshooting

### Plane won't move
```javascript
// Check in PlayerController useFrame
const mobileData = usePartyKitStore.getState().mobileData;
console.log('Mobile data:', mobileData); // Should log values
```

### Collisions not working
```javascript
// Ensure userData.tag is set
<RigidBody userData={{ tag: 'obstacle' }}>
```

### Game too fast/slow
```javascript
// Adjust in Plane.jsx
const speed = 8; // Lower = slower, higher = faster
```

### Plane too sensitive
```javascript
// Adjust in Plane.jsx
const sensitivity = 0.05; // Lower = less sensitive
```

---

## 🎉 You're Done!

You now have a fully functional gyroscope-controlled paper plane game!

**What you built**:
- ✅ Real-time mobile-to-desktop control
- ✅ 3D physics simulation
- ✅ Collision detection
- ✅ Score system
- ✅ Game over & restart
- ✅ Beautiful visuals

**Time to build**: ~2-3 hours  
**Lines of code**: ~800  
**Coolness factor**: 🔥🔥🔥

Now go add your own features and make it unique! 🚀
