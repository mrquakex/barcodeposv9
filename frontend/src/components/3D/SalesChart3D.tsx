import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Bar3DProps {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
}

function Bar3D({ position, height, color, label }: Bar3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Subtle hover effect
    const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.02;
    meshRef.current.scale.y = scale;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

interface SalesChart3DProps {
  data: Array<{ label: string; value: number }>;
}

export function SalesChart3D({ data }: SalesChart3DProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);

  const bars = useMemo(() => {
    return data.map((item, index) => {
      const normalizedHeight = (item.value / maxValue) * 5;
      const xPos = (index - data.length / 2) * 1.5;
      
      // Renk gradyanı
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];
      const colorIndex = Math.floor((item.value / maxValue) * (colors.length - 1));
      
      return {
        position: [xPos, 0, 0] as [number, number, number],
        height: normalizedHeight,
        color: colors[colorIndex],
        label: item.label,
      };
    });
  }, [data, maxValue]);

  return (
    <div className="w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Grid floor */}
        <gridHelper args={[20, 20, '#334155', '#1e293b']} />
        
        {/* Bars */}
        {bars.map((bar, index) => (
          <Bar3D key={index} {...bar} />
        ))}
        
        <OrbitControls
          enableZoom={true}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}

