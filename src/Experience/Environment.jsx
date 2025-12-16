import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { usePartyKitStore } from "../hooks";
import { Obstacle } from "./Obstacle";

export const Environment = () => {
  const longCactus = useGLTF("./assets/models/long_cactus.glb");
  const roundCactus = useGLTF("./assets/models/round_cactus.glb");
  const weirdCactus = useGLTF("./assets/models/weird_cactus.glb");
  const polyRocks = useGLTF("./assets/models/poly_rocks.glb");
  const stackedStones = useGLTF("./assets/models/stones_stacked.glb");
  const tiltedRock = useGLTF("./assets/models/tilted_rock.glb");

  const groundRef = useRef();
  const speed = 5; // Ground scroll speed (reduced)

  useFrame((state, delta) => {
    const mobileData = usePartyKitStore.getState().mobileData;
    
    // Only scroll if phone is connected
    if (!mobileData) return;

    // Move ground backward (away from camera) - creates forward flight illusion
    if (groundRef.current) {
      groundRef.current.position.z -= speed * delta;
      // Reset when it scrolls too far
      if (groundRef.current.position.z < -100) {
        groundRef.current.position.z += 200;
      }
    }
  });

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#e8b88a" />
      </mesh>

      {/* Mesa 1 - Left */}
      <group position={[-40, 0, -80]}>
        <mesh castShadow>
          <boxGeometry args={[15, 25, 12]} />
          <meshStandardMaterial color="#d98555" flatShading />
        </mesh>
        <mesh position={[0, 15, 0]} castShadow>
          <boxGeometry args={[12, 5, 10]} />
          <meshStandardMaterial color="#c97545" flatShading />
        </mesh>
      </group>

      {/* Mesa 2 - Center */}
      <group position={[0, 0, -100]}>
        <mesh castShadow>
          <boxGeometry args={[10, 20, 10]} />
          <meshStandardMaterial color="#da8960" flatShading />
        </mesh>
        <mesh position={[0, 12, 0]} castShadow>
          <boxGeometry args={[8, 4, 8]} />
          <meshStandardMaterial color="#c77550" flatShading />
        </mesh>
      </group>

      {/* Mesa 3 - Right */}
      <group position={[45, 0, -90]}>
        <mesh castShadow>
          <boxGeometry args={[18, 28, 14]} />
          <meshStandardMaterial color="#dc8b65" flatShading />
        </mesh>
        <mesh position={[0, 16, 0]} castShadow>
          <boxGeometry args={[14, 4, 11]} />
          <meshStandardMaterial color="#ca7955" flatShading />
        </mesh>
      </group>

      {/* Smaller rock formations */}
      <mesh position={[-20, -1, -40]} castShadow>
        <boxGeometry args={[5, 6, 5]} />
        <meshStandardMaterial color="#b8754f" flatShading />
      </mesh>

      <mesh position={[25, -1, -50]} castShadow>
        <boxGeometry args={[6, 8, 6]} />
        <meshStandardMaterial color="#ba7751" flatShading />
      </mesh>

      {/* Ground plane - scrolling */}
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#e8b88a" />
      </mesh>

      {/* Obstacles - scrolling */}
      <group>
        {/* Cacti - much more spread out and closer together */}
        <Obstacle model={longCactus.scene} initialPosition={[-15, 0, -15]} scale={3} />
        <Obstacle model={roundCactus.scene} initialPosition={[18, 0, -25]} scale={0.8} />
        <Obstacle model={weirdCactus.scene} initialPosition={[-8, 0, -35]} scale={1.8} />
        <Obstacle model={longCactus.scene} initialPosition={[25, 0, -45]} scale={3} />
        <Obstacle model={roundCactus.scene} initialPosition={[-20, 0, -55]} scale={0.8} />
        <Obstacle model={weirdCactus.scene} initialPosition={[12, 0, -65]} scale={2.1} />
        <Obstacle model={longCactus.scene} initialPosition={[-28, 0, -75]} scale={3} />
        <Obstacle model={roundCactus.scene} initialPosition={[22, 0, -85]} scale={0.8} />
        <Obstacle model={weirdCactus.scene} initialPosition={[-12, 0, -95]} scale={2.2} />
        <Obstacle model={longCactus.scene} initialPosition={[16, 0, -105]} scale={3} />
        <Obstacle model={roundCactus.scene} initialPosition={[-25, 0, -115]} scale={0.8} />
        <Obstacle model={weirdCactus.scene} initialPosition={[20, 0, -125]} scale={2} />
        <Obstacle model={longCactus.scene} initialPosition={[-18, 0, -135]} scale={3} />
        <Obstacle model={roundCactus.scene} initialPosition={[28, 0, -145]} scale={0.8} />

        {/* Rocks/Stones - scattered closer */}
        <Obstacle model={polyRocks.scene} initialPosition={[-10, 0, -20]} scale={1.5} />
        <Obstacle model={stackedStones.scene} initialPosition={[15, 0, -30]} scale={2} />
        <Obstacle model={tiltedRock.scene} initialPosition={[-22, 0, -40]} scale={2} />
        <Obstacle model={polyRocks.scene} initialPosition={[20, 0, -50]} scale={1.5} />
        <Obstacle model={stackedStones.scene} initialPosition={[-15, 0, -60]} scale={2} />
        <Obstacle model={tiltedRock.scene} initialPosition={[28, 0, -70]} scale={2} />
        <Obstacle model={polyRocks.scene} initialPosition={[-12, 0, -80]} scale={1.5} />
        <Obstacle model={tiltedRock.scene} initialPosition={[16, 0, -90]} scale={2} />
        <Obstacle model={stackedStones.scene} initialPosition={[-20, 0, -100]} scale={2} />
        <Obstacle model={polyRocks.scene} initialPosition={[25, 0, -110]} scale={1.5} />
        <Obstacle model={tiltedRock.scene} initialPosition={[-16, 0, -120]} scale={2} />
        <Obstacle model={stackedStones.scene} initialPosition={[22, 0, -130]} scale={2} />
        <Obstacle model={polyRocks.scene} initialPosition={[-28, 0, -140]} scale={1.5} />
      </group>

      {/* Sky gradient backdrop */}
      <mesh position={[0, 30, -120]} rotation={[0, 0, 0]}>
        <planeGeometry args={[300, 100]} />
        <meshBasicMaterial color="#87ceeb" />
      </mesh>
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