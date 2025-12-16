import * as THREE from "three";
import React, { useRef, useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { RigidBody, BallCollider, useRopeJoint } from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { useFrame, extend } from "@react-three/fiber";
import { Hook } from "./models/Hook";
import { clamp, damp } from "three/src/math/MathUtils.js";
import { useStore } from "../store";
import { eventBus, EVENTS } from "../utils";
import gsap from "gsap";
import { usePartyKitStore } from "../hooks";

extend({ MeshLineGeometry, MeshLineMaterial });

export const PlayerController = () => {
  const plane = useGLTF("./assets/models/PLANE.glb");
  const hookMesh = useRef();
  const canneRef = useRef();
  const fishBody = useRef();

  const rodTip = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const j4 = useRef();
  const j5 = useRef();
  const hook = useRef();
  const rope = useRef();
  const tipRef = useRef();
  const prevBeta = useRef(0);
  const isCatching = useRef(false);
  const hookSensor = useRef();
  const setHookPosition = useStore((state) => state.setHookPosition);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );

  const ropeSegmentSize = 0.65;

  useRopeJoint(rodTip, j1, [[0, 0, 0], [0, 0, 0], ropeSegmentSize]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], ropeSegmentSize]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], ropeSegmentSize]);
  useRopeJoint(j3, j4, [[0, 0, 0], [0, 0, 0], ropeSegmentSize]);
  useRopeJoint(j4, j5, [[0, 0, 0], [0, 0, 0], ropeSegmentSize]);
  useRopeJoint(j5, hook, [[0, 0, 0], [0, 0, 0], ropeSegmentSize]);

  const lerpedPositions = {
    j1: useRef(new THREE.Vector3()),
    j2: useRef(new THREE.Vector3()),
    j3: useRef(new THREE.Vector3()),
    j4: useRef(new THREE.Vector3()),
    j5: useRef(new THREE.Vector3()),
  };

  const sensitivity = 10;
  const hookTiming = useRef(0);

  const updateRope = (delta) => {
    const tipRefWorldPos = tipRef.current.getWorldPosition(new THREE.Vector3());
    rodTip.current.setTranslation(
      { x: tipRefWorldPos.x, y: tipRefWorldPos.y, z: tipRefWorldPos.z },
      true
    );

    [j1, j2, j3, j4, j5].forEach((ref, index) => {
      const targetPos = ref.current.translation();
      const lerpRef = lerpedPositions[`j${index + 1}`];
      lerpRef.current.lerp(targetPos, delta * 10);
    });

    curve.points[0].copy(rodTip.current.translation());
    curve.points[1].copy(lerpedPositions.j1.current);
    curve.points[2].copy(lerpedPositions.j2.current);
    curve.points[3].copy(lerpedPositions.j3.current);
    curve.points[4].copy(lerpedPositions.j4.current);
    curve.points[5].copy(lerpedPositions.j5.current);
    curve.points[6].copy(hook.current.translation());
    hookMesh.current.position.copy(hook.current.translation());
    const rotX = clamp(
      lerpedPositions.j3.current.z - hookMesh.current.position.z,
      -Math.PI / 2,
      Math.PI / 2
    );
    const rotZ = lerpedPositions.j1.current.x - hookMesh.current.position.x;
    hookMesh.current.rotation.set(rotX, 0, -rotZ * 0.5);
    rope.current.geometry.setPoints(curve.getPoints(32));
  };

  const updateCannePosition = (delta, b, g, a) => {
    const base = new THREE.Vector3(0, 0, 0);
    const target = base
      .clone()
      .add(new THREE.Vector3(5 - b * sensitivity * 2, 2, a * sensitivity));

    if (!isCatching.current) {
      canneRef.current.position.lerp(target, delta * 12);
      canneRef.current.rotation.x = damp(
        canneRef.current.rotation.x,
        -g,
        8,
        delta
      );
    }
    hookSensor.current.setTranslation(hook.current.translation());
  };

  const getMobilePitchVelocity = (b, delta) => {
    prevBeta.current = damp(prevBeta.current, b, 2, delta);
    return Math.abs(b) - Math.abs(prevBeta.current) > 0.5;
  };

  const trackFish = (delta, isCatchingNow) => {
    if (fishBody.current) {
      hookTiming.current += delta;
      const fishPosition = fishBody.current.translation();
      hook.current.setTranslation(fishPosition);
      if (hookTiming.current > 1.5) {
        fishBody.current.userData.unHook();
        eventBus.emit(EVENTS.FISH.HOOKED, false);
        fishBody.current = null;
        hookTiming.current = 0;
      }
      isCatchingNow && eventBus.emit(EVENTS.CANNE.LIFTED);
    }
  };
  useFrame((state, delta) => {
    if (
      !rodTip.current ||
      !j1.current ||
      !j2.current ||
      !j3.current ||
      !hook.current ||
      !rope.current ||
      !tipRef.current
    )
      return;
    const mobileData = usePartyKitStore.getState().mobileData
    // console.log(mobileData)
    if (!mobileData) return;
    const { alpha, beta, gamma } = mobileData;

    const b = THREE.MathUtils.degToRad(beta || 0);
    const g = THREE.MathUtils.degToRad(gamma || 0);
    const a = THREE.MathUtils.degToRad(alpha || 0);

    updateCannePosition(delta, b, g, a);
    const isCatchingNow = getMobilePitchVelocity(b, delta);
    // hook.current.translation().y = 1
    trackFish(delta, isCatchingNow);
    updateRope(delta);
    setHookPosition({
      hook: hook.current.translation(),
      j5: lerpedPositions.j5.current,
    });
  });

  useEffect(() => {
    eventBus.on(EVENTS.CANNE.LIFTED, () => {
      if (fishBody.current) {
        isCatching.current = true;
        fishBody.current.userData.catch();
        fishBody.current = null;

        gsap.to(canneRef.current.position, {
          x: 0,
          y: 12,
          duration: 1,
          ease: "back.out(4)",
        });
        gsap.to(canneRef.current.rotation, {
          z: -0.8,
          duration: 0.6,
          ease: "back.out(10)",
          onComplete: () => {
            gsap.to(canneRef.current.position, {
              y: 2,
              duration: 0.6,
              delay: 1,
              ease: "power3.out",
            });
            gsap.to(canneRef.current.rotation, {
              z: 0,
              duration: 0.6,
              delay: 1,
              ease: "power3.out",
              onComplete: () => {
                isCatching.current = false;
              },
            });
          },
        });
      }
    });
  });

  const ropeDamping = {
    linearDamping: 7,
    angularDamping: 4,
  };
  return (
    <group dispose={null}>
      <group ref={canneRef} position={[0, 2, 0]} rotation-y={0.3}>
        {/* Debug box - you should see this red cube */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* Your plane - trying different scales and positions */}
        <primitive 
          object={plane.scene} 
          scale={0.5}
          rotation={[0, Math.PI, 0]}
          position={[0, 0, 0]}
        />
        
        <mesh visible={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <group ref={tipRef} position={[0, 1.35, -0.2]}>
          </group>
        </mesh>
      </group>

      <RigidBody
        canSleep={false}
        ref={rodTip}
        type="kinematicPosition"
        position={[-1.258, 0.48, 0]}
      >
        <BallCollider args={[0.01]} />
      </RigidBody>
      <RigidBody
        ref={j1}
        position={[-1.258, 0.3, 0]}
        colliders={false}
        type="dynamic"
        {...ropeDamping}
      >
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody
        canSleep={false}
        ref={j2}
        position={[-1.258, 0.2, 0]}
        colliders={false}
        type="dynamic"
        {...ropeDamping}
      >
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody
        canSleep={false}
        ref={j3}
        position={[-1.258, 0.1, 0]}
        colliders={false}
        type="dynamic"
        {...ropeDamping}
      >
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody
        canSleep={false}
        ref={j4}
        position={[-1.258, 0, 0]}
        colliders={false}
        type="dynamic"
        {...ropeDamping}
      >
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody
        canSleep={false}
        ref={j5}
        position={[-1.258, -0.1, 0]}
        colliders={false}
        type="dynamic"
        {...ropeDamping}
      >
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody
        // onIntersectionEnter={(payload) => {
        //   if (fishBody.current || isCatching.current) {
        //     return;
        //   }

        //   if (payload.other.rigidBody.userData.type === "fish") {
        //     fishBody.current = payload.other.rigidBody;
        //     payload.other.rigidBody.userData.hook();
        //   }
        // }}
        // sensor
        canSleep={false}
        ref={hook}
        position={[-1.258, -0.3, 0]}
        colliders={false}
        type="dynamic"
        {...ropeDamping}
      >
        <BallCollider args={[0.1]} />
      </RigidBody>
            <RigidBody
        onIntersectionEnter={(payload) => {
          if (fishBody.current || isCatching.current) {
            return;
          }

          if (payload.other.rigidBody.userData.type === "fish") {
            fishBody.current = payload.other.rigidBody;
            payload.other.rigidBody.userData.hook();
          }
        }}
        sensor
        canSleep={false}
        ref={hookSensor}
        position={[-1.258, -0.3, 0]}
        colliders={false}
        type="dynamic"
        {...ropeDamping}
      >
        <BallCollider args={[0.1]} />
      </RigidBody>
      <group ref={hookMesh} position={[0, 0, 0]}>
        <Hook />
      </group>

      <mesh ref={rope}>
        <meshLineGeometry />
        <meshLineMaterial color="#2e2e2e" lineWidth={0.03} />
      </mesh>
    </group>
  );
};

useGLTF.preload("./assets/models/PLANE.glb");
