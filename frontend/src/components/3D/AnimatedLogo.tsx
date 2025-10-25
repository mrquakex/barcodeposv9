import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        color="#3b82f6"
        metalness={0.8}
        roughness={0.2}
        emissive="#1d4ed8"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function FloatingText() {
  const textRef = useRef<any>(null);

  useFrame((state) => {
    if (!textRef.current) return;
    textRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.5 + 2;
  });

  return (
    <Center ref={textRef}>
      <Text3D
        font="/fonts/helvetiker_regular.typeface.json"
        size={0.5}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
      >
        POS
        <meshNormalMaterial />
      </Text3D>
    </Center>
  );
}

export function AnimatedLogo() {
  return (
    <div className="w-full h-64 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        <RotatingBox />
        
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  );
}

