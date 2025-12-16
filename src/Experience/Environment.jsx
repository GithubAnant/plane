export const Environment = () => {
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

      {/* Cacti */}
      <group position={[-8, -2, 10]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 4]} />
          <meshStandardMaterial color="#6b9a5b" flatShading />
        </mesh>
        <mesh position={[0.6, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#6b9a5b" flatShading />
        </mesh>
      </group>

      <group position={[12, -2, 5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.4, 5]} />
          <meshStandardMaterial color="#6b9a5b" flatShading />
        </mesh>
      </group>

      <group position={[-15, -2, -10]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.35, 0.35, 4.5]} />
          <meshStandardMaterial color="#6b9a5b" flatShading />
        </mesh>
        <mesh position={[-0.7, 0.8, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.5]} />
          <meshStandardMaterial color="#6b9a5b" flatShading />
        </mesh>
      </group>

      {/* Sky gradient backdrop */}
      <mesh position={[0, 30, -120]} rotation={[0, 0, 0]}>
        <planeGeometry args={[300, 100]} />
        <meshBasicMaterial color="#87ceeb" />
      </mesh>
    </group>
  );
};
