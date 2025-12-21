import { useGLTF, Environment as DreiEnvironment, Stars, Cloud } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { usePartyKitStore } from "../hooks";
import { useGameStore } from "../store/gameStore";
import { Obstacle } from "./Obstacle";
import { Pickup } from "./Pickup";
import * as THREE from "three";

export const Environment = () => {
  const longCactus = useGLTF("./assets/models/long_cactus.glb");
  const roundCactus = useGLTF("./assets/models/round_cactus.glb");
  const weirdCactus = useGLTF("./assets/models/weird_cactus.glb");
  const polyRocks = useGLTF("./assets/models/poly_rocks.glb");
  const stackedStones = useGLTF("./assets/models/stones_stacked.glb");
  const tiltedRock = useGLTF("./assets/models/tilted_rock.glb");
  const yellow_bird = useGLTF("./assets/models/yellow_bird.glb");
  const green_bird = useGLTF("./assets/models/green_bird.glb");
  const blue_bird = useGLTF("./assets/models/blue_bird.glb");
  const red_bird = useGLTF("./assets/models/red_bird.glb");

  const groundRef = useRef();
  const groundRef2 = useRef();
  const speed = 30; // Increased speed for more thrill 

  const gameState = useGameStore((state) => state.gameState);

  useFrame((state, delta) => {
    if (gameState !== 'PLAYING') return;

    // Scroll two ground planes for seamless infinite scrolling
    if (groundRef.current) {
      groundRef.current.position.z -= speed * delta;
      // If ground moves from 0 to -400, it passes the camera.
      if (groundRef.current.position.z < -200) {
        // Reset to +600 (behind the second ground plane which is at 200?) 
        // Wait, ground2 starts at 400. Ground1 starts at 0.
        // If Ground1 < -200. Ground2 is at +200?
        // We want Ground1 to jump to behind Ground2.
        // If size is 400.
        groundRef.current.position.z += 800; 
      }
    }
    if (groundRef2.current) {
      groundRef2.current.position.z -= speed * delta;
      if (groundRef2.current.position.z < -200) {
        groundRef2.current.position.z += 800;
      }
    }
  });

  // Background Mountains (Static)
  const Background = () => (
    <group>
      {/* Front Left */}
      <primitive object={tiltedRock.scene.clone()} position={[-80, -10, 100]} scale={30} rotation={[0, 1, 0]} />
      {/* Front Right */}
      <primitive object={tiltedRock.scene.clone()} position={[80, -10, 80]} scale={30} rotation={[0, -1, 0]} />
      {/* Back Center */}
      <primitive object={polyRocks.scene.clone()} position={[0, -20, 250]} scale={80} />
      {/* Far Left */}
      <primitive object={stackedStones.scene.clone()} position={[-150, -10, 200]} scale={50} />
       {/* Far Right */}
      <primitive object={stackedStones.scene.clone()} position={[150, -10, 200]} scale={50} />
    </group>
  );

  const Ground = () => (
     <>
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#e8b88a" roughness={1} />
      </mesh>
      <mesh ref={groundRef2} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 400]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#e8b88a" roughness={1} />
      </mesh>
     </>
  )

  // Procedural-ish Obstacle positions
  const { obstacles, pickups } = useMemo(() => {
    const obs = [];
    const picks = [];
    
    // Weighted models: Repeat Cacti to increase probability
    // 0-2: Cactus, 3: Stones, 4: Rocks
    // Let's add more cacti indices
    const models = [
        { m: longCactus.scene, s: 9, y: -2 },   // 0: Cactus
        { m: roundCactus.scene, s: 6, y: -2 },  // 1: Cactus
        { m: weirdCactus.scene, s: 4, y: -2 },  // 2: Cactus
        { m: longCactus.scene, s: 11, y: -2 },   // 3: Cactus (Big)
        { m: stackedStones.scene, s: 6, y: -1 },// 4: Stone
        { m: polyRocks.scene, s: 12, y: -1 }     // 5: Rock
    ];
    
    const birdModels = [
        yellow_bird.scene, green_bird.scene, blue_bird.scene, red_bird.scene
    ];
    
    // Generate a sequence of 50 obstacles (More density)
    for(let i=0; i<50; i++) {
        const type = Math.floor(Math.random() * models.length);
        const xDir = Math.random() > 0.5 ? 1 : -1;
        
        // Z position: Start at 500 (Clear runway), spacing 25 (tighter)
        const zPos = 200 + (i * 25); 
        
        // Dynamic X position for wider play area. Use full width (-30 to 30)
        const xPos = (Math.random() * 56 - 28); // Random between -28 and 28
        
        obs.push({
            id: i,
            model: models[type].m,
            pos: [xPos, models[type].y, zPos],
            scale: models[type].s
        });
        
        // Spawn a pickup occasionally
        if (i % 3 === 0) {
            const bType = Math.floor(Math.random() * birdModels.length);
            picks.push({
                id: i,
                model: birdModels[bType],
                pos: [
                    (Math.random() * 50 - 25), // Wider range (-25 to 25)
                    (Math.random() * 5 + 2),   // Higher up in the air
                    zPos + 20                  // In between obstacles
                ],
                scale: 0.5 // Birds are small
            });
        }
    }
    return { obstacles: obs, pickups: picks };
  }, []);

  return (
    <group>
      <DreiEnvironment preset="sunset" />
      <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
      <ambientLight intensity={0.5} />
      
      {/* Sky */}
      <mesh position={[0, 0, -300]} scale={[500, 200, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#87CEEB" /> 
      </mesh>
      
      <Ground />
      <Background />

      {obstacles.map(o => (
         <Obstacle 
            key={o.id} 
            model={o.model} 
            initialPosition={o.pos} 
            scale={o.scale} 
         />
      ))}

      {pickups.map(p => (
         <Pickup 
            key={p.id} 
            model={p.model} 
            initialPosition={p.pos} 
            scale={p.scale} 
         />
      ))}
      
      {/* Add some clouds/stars for atmosphere */}
      <Cloud position={[-4, 20, -20]} speed={0.2} opacity={0.5} />
      <Cloud position={[4, 20, -50]} speed={0.2} opacity={0.5} />
      <Cloud position={[0, 20, -100]} speed={0.2} opacity={0.5} />

    </group>
  );
};

// Preload models
useGLTF.preload("./assets/models/long_cactus.glb");
useGLTF.preload("./assets/models/round_cactus.glb");
useGLTF.preload("./assets/models/weird_cactus.glb");
useGLTF.preload("./assets/models/poly_rocks.glb");
useGLTF.preload("./assets/models/tilted_rock.glb");
useGLTF.preload("./assets/models/stones_stacked.glb");
useGLTF.preload("./assets/models/yellow_bird.glb");
useGLTF.preload("./assets/models/green_bird.glb");
useGLTF.preload("./assets/models/blue_bird.glb");
useGLTF.preload("./assets/models/red_bird.glb");