import * as THREE from "three";
import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { usePartyKitStore } from "../hooks";
import { RigidBody } from "@react-three/rapier";
import { useGameStore } from "../store/gameStore";

export const PlayerController = () => {
  const plane = useGLTF("/assets/models/PLANE.glb");
  const planeRef = useRef();
  const rigidBodyRef = useRef();
  const { setGameOver, isGameOver, incrementScore, gameState, startGame, resetGame } = useGameStore();
  
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

  const calibrationRef = useRef({ beta: 0, gamma: 0 });
  
  // Listen for recalibrate button
  useEffect(() => {
    const unsub = usePartyKitStore.subscribe((state) => state.lastAction, (action) => {
        if (action && action.id === 'A') {
             // Logic for Restarting
             const storeState = useGameStore.getState();
             if (storeState.gameState === 'GAMEOVER') {
                 console.log("Restarting Game...");
                 storeState.resetGame();
                 storeState.startGame();
                 // Physics reset is handled by useEffect([gameState])
             }

             console.log("Recalibrating!");
             const currentData = usePartyKitStore.getState().mobileData;
             if (currentData) {
                 calibrationRef.current = { 
                     beta: currentData.beta || 0, 
                     gamma: currentData.gamma || 0 
                 };
             }
        }
    });
    return () => unsub();
  }, []); // Restored closing bracket for the first useEffect

  // Centralized Reset Logic: Watch for Game State changes
  // When state goes to START or PLAYING, reset physics.
  useEffect(() => {
    if (gameState === 'START' || gameState === 'PLAYING') {
         // Reset physics position, velocity, AND rotation
         if (rigidBodyRef.current) {
            rigidBodyRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true);
            rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
            rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
         }
         // Reset visual rotation
         if (planeRef.current) {
            planeRef.current.rotation.set(0, 0, 0);
         }
         
         // Recalibrate to current phone position!
         // This ensures that however the user is holding the phone right now becomes "Level"
         const currentMobileData = usePartyKitStore.getState().mobileData;
         if (currentMobileData) {
              calibrationRef.current = { 
                  beta: currentMobileData.beta || 0, 
                  gamma: currentMobileData.gamma || 0 
              };
         } else {
             // Fallback if no data yet
             calibrationRef.current = { beta: 0, gamma: 0 };
         }
    }
  }, [gameState]); // Runs whenever gameState changes

  useFrame((state, delta) => {
    if (!planeRef.current || !rigidBodyRef.current) return;
    
    // Auto-start game on first movement/interaction could be added here, 
    // but for now let's respect the START state.
    const mobileData = usePartyKitStore.getState().mobileData;
    
    if (gameState !== 'PLAYING') {
      // Keep plane hovering/idle if not playing
      if (gameState === 'START' && mobileData) {
        startGame(); // Start game when phone connects/sends data
      }
      return;
    }
    
    // If no gyro data yet, keep plane horizontal
    if (!mobileData) return;

    // Increment score (distance traveled) - 1 meter per second
    incrementScore(delta * 1);
    
    // Handle Recalibration logic is handled via useEffect updating the ref.
    // In useFrame we just read the ref.
    
    const { beta, gamma } = mobileData;

    // Apply calibration
    // We assume the user holds the phone in their "neutral" position when hitting A.
    // So we subtract the calibration offset.
    const bVal = (beta || 0) - calibrationRef.current.beta;
    const gVal = (gamma || 0) - calibrationRef.current.gamma;

    // Convert to radians
    const b = THREE.MathUtils.degToRad(bVal);
    const g = THREE.MathUtils.degToRad(gVal);

    // Tilt plane based on phone orientation
    // gamma (left/right tilt) -> roll (z-axis rotation)
    planeRef.current.rotation.z = THREE.MathUtils.clamp(g * 0.3, -Math.PI / 3, Math.PI / 3);
    
    // beta (forward/back tilt) -> pitch (x-axis rotation)
    const pitchAmount = -b * 0.1;
    planeRef.current.rotation.x = THREE.MathUtils.clamp(pitchAmount, -Math.PI / 4, Math.PI / 4);
    
    // Calculate velocity based on tilt
    const xVelocity = -g * sensitivity * 10;
    const yVelocity = pitchAmount * sensitivity * 5;
    
    // Apply velocity to rigid body for physics-based movement
    // We keep Z velocity at 0 because the WORLD moves around us, we don't move forward physically
    
    // Soft Boundary Logic:
    // If we are past the edge AND trying to move further out, stop the movement.
    const currentPos = rigidBodyRef.current.translation();
    let finalXVelocity = xVelocity;
    let finalYVelocity = yVelocity;

    const X_LIMIT = 30; // Increased from 10 to 30
    const Y_Min = -1;
    const Y_Max = 8;
    
    if (currentPos.x > X_LIMIT && xVelocity > 0) finalXVelocity = 0;
    if (currentPos.x < -X_LIMIT && xVelocity < 0) finalXVelocity = 0;
    
    if (currentPos.y > Y_Max && yVelocity > 0) finalYVelocity = 0;
    if (currentPos.y < Y_Min && yVelocity < 0) finalYVelocity = 0;

    rigidBodyRef.current.setLinvel({ x: finalXVelocity, y: finalYVelocity, z: 0 }, true);

    // Backup visual clamp only if things go extremly wild (like clipping through physics)
    // but loosening it to allow soft touching
    if (currentPos.x < -35 || currentPos.x > 35) {
       const clampedX = THREE.MathUtils.clamp(currentPos.x, -32, 32);
       rigidBodyRef.current.setTranslation({ x: clampedX, y: currentPos.y, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic" // Changed to dynamic for collision events
      gravityScale={0} // No gravity so it doesn't fall
      colliders="cuboid"
      position={[0, 1, 0]}
      scale={[2, 1, 2]}
      onCollisionEnter={({ other }) => {
        if (gameState === 'PLAYING') {
            console.log("Collision!", other);
            setGameOver();
        }
      }}
    >
      <group ref={planeRef}>
        <primitive 
          object={plane.scene} 
          scale={0.5}
          rotation={[0, Math.PI, 0]}
        />
      </group>
    </RigidBody>
  );
};

useGLTF.preload("/assets/models/PLANE.glb");
