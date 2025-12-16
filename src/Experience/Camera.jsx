import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { EVENTS, eventBus, fishCaughtPosition, fishCaughtAnimationDuration } from "../utils";
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
    const { x, y, z } = fishCaughtPosition;
    eventBus.on(EVENTS.FISH.CAUGHT, () => {
      gsap.to(cameraLookAtRef.current.position, {
        x: x,
        y: y,
        z: z,
        duration: 0.6,
        ease: "power3.out",
        onComplete: () => {


          gsap.to(cameraLookAtRef.current.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.6,
            delay: fishCaughtAnimationDuration / 2,
            ease: "power3.out",

          });
        },
      });
    });
  }, []);
  return (
    <>
      <group ref={cameraLookAtRef} position={[0, 2, 0]}></group>
      <PerspectiveCamera
        makeDefault={true}
        position={[0, 5, -10]}
        fov={60}
      />
    </>
  );
};
