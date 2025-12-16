import * as THREE from "three";
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { usePartyKitStore } from "../hooks";

export const PlayerController = () => {
  const plane = useGLTF("./assets/models/PLANE.glb");
  const planeRef = useRef();
  // const velocityRef = useRef({ x: 0, y: 0, z: 0 });

  // Reduced sensitivity for smoother control
  const sensitivity = 4;
  const forwardSpeed = 0; // Constant forward motion
  useFrame((state, delta) => {
    if (!planeRef.current) return;
    
    const mobileData = usePartyKitStore.getState().mobileData;
    if (!mobileData) return;
    
    const { beta, gamma } = mobileData;

    // Convert to radians
    const b = THREE.MathUtils.degToRad(beta || 0);
    const g = THREE.MathUtils.degToRad(gamma || 0);

    // Tilt plane based on phone orientation
    // gamma (left/right tilt) -> roll (z-axis rotation)
    planeRef.current.rotation.z = g * 0.5;
    
    // beta (forward/back tilt) -> pitch (x-axis rotation)
    const pitchAmount = -(b - Math.PI / 2) * 0.2;
    planeRef.current.rotation.x = pitchAmount;
    
    // Only climb/dive if pitch is significant (deadzone)
    const climbRate = 0;
    
    // Move plane - constant forward + climb/dive based on pitch
    planeRef.current.position.z += forwardSpeed; // Always moving forward
    planeRef.current.position.x += -g * sensitivity * delta; // Side to side
    planeRef.current.position.y += climbRate * delta; // Climb/dive based on pitch
  });

  return (
    <group ref={planeRef} position={[0, 2, 0]}>
      <primitive 
        object={plane.scene} 
        scale={0.5}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
};

useGLTF.preload("./assets/models/PLANE.glb");
