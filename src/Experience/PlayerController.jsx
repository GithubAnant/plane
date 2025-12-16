import * as THREE from "three";
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { usePartyKitStore } from "../hooks";

export const PlayerController = () => {
  const plane = useGLTF("./assets/models/PLANE.glb");
  const planeRef = useRef();
  // const tipRef = useRef();

  // Reduced sensitivity for smoother control
  const sensitivity = 5;
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
    planeRef.current.rotation.z = g * 0.3;
    
    // beta (forward/back tilt) -> pitch (x-axis rotation) - inverted
    planeRef.current.rotation.x = -(b - Math.PI / 2) * 0.2;
    
    // Position directly maps to tilt (so recalibration recenters it)
    planeRef.current.position.x = -g * sensitivity;
    planeRef.current.position.y = 2 + b * sensitivity; // Inverted: forward tilt = up
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
