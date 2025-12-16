import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { Particles } from "./Particles/Particles";
import { Camera } from "./Camera";
import { PlayerController } from "./PlayerController";
import { Environment } from "./Environment";

export const Experience = () => {
  return (
    <>
      <color attach="background" args={["#e0c4a3"]} />
      <fog attach="fog" args={["#e8cdb0", 30, 150]} />
      <Suspense fallback={null}>
        <Physics gravity={[0, -40, 0]} timeStep={"vary"}>
          <PlayerController />
        </Physics>
        <Environment />
      </Suspense>
      <Particles />
      <Camera/>
      <ambientLight intensity={2} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={2} 
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* <RenderTargetExample /> */}
    </>
  )
};