import { RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { usePartyKitStore } from "../hooks";

export const Obstacle = ({ model, initialPosition, scale }) => {
  const rigidBodyRef = useRef();
  const speed = 5;

  useFrame((state, delta) => {
    const mobileData = usePartyKitStore.getState().mobileData;
    if (!mobileData || !rigidBodyRef.current) return;

    const currentPos = rigidBodyRef.current.translation();
    const newZ = currentPos.z - speed * delta;

    // Reset to front when it passes behind camera
    if (newZ < -150) {
      rigidBodyRef.current.setTranslation(
        { x: initialPosition[0], y: initialPosition[1], z: newZ + 160 },
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
