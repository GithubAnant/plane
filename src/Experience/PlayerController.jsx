import * as THREE from "three";
import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { usePartyKitStore } from "../hooks";
import { RigidBody } from "@react-three/rapier";
import { useGameStore } from "../store/gameStore";

export const PlayerController = () => {
  const plane = useGLTF("./assets/models/PLANE.glb");
  const planeRef = useRef();
  const rigidBodyRef = useRef();
  const setGameOver = useGameStore((state) => state.setGameOver);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const incrementScore = useGameStore((state) => state.incrementScore);

  // Reduced sensitivity for smoother control
  const sensitivity = 4;
  const forwardSpeed = 0; // Constant forward motion

  // Add outline effect to the plane
  useEffect(() => {
    if (!plane.scene) return;

    plane.scene.traverse((child) => {
      if (child.isMesh) {
        // Create outline for each mesh
        const outline = child.clone();
        outline.material = new THREE.MeshBasicMaterial({
          color: 0x000000,
          side: THREE.BackSide
        });
        outline.scale.multiplyScalar(1.025);
        child.parent.add(outline);
      }
    });
  }, [plane.scene]);

  useFrame((state, delta) => {
    if (!planeRef.current || !rigidBodyRef.current || isGameOver) return;
    
    const mobileData = usePartyKitStore.getState().mobileData;
    
    // If no gyro data yet, keep plane horizontal
    if (!mobileData) {
      planeRef.current.rotation.x = 0;
      planeRef.current.rotation.z = 0;
      return;
    }

    // Increment score (distance traveled) - roughly 5 units per second
    incrementScore(delta * 5);
    
    const { beta, gamma } = mobileData;

    // Convert to radians
    const b = THREE.MathUtils.degToRad(beta || 0);
    const g = THREE.MathUtils.degToRad(gamma || 0);

    // Tilt plane based on phone orientation
    // gamma (left/right tilt) -> roll (z-axis rotation) - clamp to prevent extreme rolls
    planeRef.current.rotation.z = THREE.MathUtils.clamp(g * 0.3, -Math.PI / 3, Math.PI / 3);
    
    // beta (forward/back tilt) -> pitch (x-axis rotation)
    // When calibrated, beta should be close to 0, so plane stays horizontal
    const pitchAmount = -b * 0.1;
    planeRef.current.rotation.x = THREE.MathUtils.clamp(pitchAmount, -Math.PI / 4, Math.PI / 4);
    
    // Only climb/dive if pitch is significant (deadzone)
    const climbRate = 0;
    
    // Move plane - constant forward + climb/dive based on pitch
    planeRef.current.position.z += forwardSpeed; // Always moving forward
    planeRef.current.position.x += -g * sensitivity * 2 * delta; // Side to side
    planeRef.current.position.y += climbRate * delta; // Climb/dive based on pitch
    
    // Clamp position to keep plane in viewport
    planeRef.current.position.x = THREE.MathUtils.clamp(planeRef.current.position.x, -10, 10);
    planeRef.current.position.y = THREE.MathUtils.clamp(planeRef.current.position.y, -2, 6);

    // Update rigid body position to match plane
    rigidBodyRef.current.setTranslation(planeRef.current.position, true);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="cuboid"
      position={[0, 0, 0]}
      onCollisionEnter={() => {
        setGameOver(true);
      }}
    >
      <group ref={planeRef} position={[0, 0, 0]}>
        <primitive 
          object={plane.scene} 
          scale={0.5}
          rotation={[0, Math.PI, 0]}
        />
      </group>
    </RigidBody>
  );
};

useGLTF.preload("./assets/models/PLANE.glb");
