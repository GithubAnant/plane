import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { EVENTS, eventBus } from "../utils";
import gsap from "gsap";

export const Camera = () => {
  const cameraLookAtRef = useRef();

  useFrame(({ camera }) => {

    if (cameraLookAtRef.current) {
      camera.lookAt(cameraLookAtRef.current.position);
      camera.updateProjectionMatrix();
    }
  });

  useEffect(() => {
    // Simplified Camera logic without fish events
    // If we want new events (like 'CRASH'), we can add them here later.
  }, []);
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
