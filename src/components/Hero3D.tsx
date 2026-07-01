"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function GlobalNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  const [hovered, setHovered] = useState(false);

  // Animate the network
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle overall float
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
      
      // Rotate the whole group based on mouse
      const targetX = (state.pointer.x * Math.PI) / 6;
      const targetY = (state.pointer.y * Math.PI) / 6;
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetX,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -targetY,
        0.05
      );
    }

    // Individual component rotations
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * (hovered ? 0.8 : 0.2);
      ring1Ref.current.rotation.y += delta * (hovered ? 0.6 : 0.15);
      
      // Scale up when hovered
      const scale = hovered ? 1.1 : 1;
      ring1Ref.current.scale.setScalar(THREE.MathUtils.lerp(ring1Ref.current.scale.x, scale, 0.1));
    }
    
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x -= delta * (hovered ? 0.6 : 0.15);
      ring2Ref.current.rotation.y -= delta * (hovered ? 0.8 : 0.2);
      
      const scale = hovered ? 1.15 : 1;
      ring2Ref.current.scale.setScalar(THREE.MathUtils.lerp(ring2Ref.current.scale.x, scale, 0.1));
    }
    
    if (coreRef.current) {
      const scale = hovered ? 1.05 : 1;
      coreRef.current.scale.setScalar(THREE.MathUtils.lerp(coreRef.current.scale.x, scale, 0.1));
    }
  });

  return (
    <group 
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Central Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial 
          color={hovered ? "#34d399" : "#0f172a"} // Emerald to Slate
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2}
        />
      </mesh>

      {/* Outer Ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.5, 0.05, 16, 100]} />
        <meshPhysicalMaterial 
          color="#94a3b8" // Slate-400
          roughness={0.2}
          metalness={1}
          transmission={0.5}
          thickness={0.5}
          envMapIntensity={2}
        />
      </mesh>

      {/* Outer Ring 2 (Orthogonal) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.02, 16, 100]} />
        <meshPhysicalMaterial 
          color="#10b981" // Emerald-500
          emissive="#10b981"
          emissiveIntensity={hovered ? 0.8 : 0.2}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* Floating Nodes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <FloatingNode key={i} index={i} hovered={hovered} />
      ))}
    </group>
  );
}

function FloatingNode({ index, hovered }: { index: number, hovered: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  
  // Random starting positions
  const position = useMemo(() => {
    const angle = (index / 8) * Math.PI * 2;
    const radius = 2.2 + Math.random() * 0.5;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 2,
      Math.sin(angle) * radius
    );
  }, [index]);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime;
      const offset = index * 10;
      ref.current.position.y = position.y + Math.sin(time * 2 + offset) * 0.2;
      
      const targetScale = hovered ? 1.5 : 1;
      ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.1));
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshPhysicalMaterial 
        color="#ffffff"
        emissive={index % 2 === 0 ? "#10b981" : "#3b82f6"}
        emissiveIntensity={hovered ? 1.5 : 0.5}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#10b981" />
        
        <GlobalNetwork />
        
        <Environment preset="city" />
        <ContactShadows 
          position={[0, -2.5, 0]} 
          opacity={0.3} 
          scale={15} 
          blur={1.5} 
          far={4} 
          color="#0f172a"
        />
        
        {/* Enable limited user interaction if desired */}
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 + 0.2} minPolarAngle={Math.PI / 2 - 0.4} />
      </Canvas>
    </div>
  );
}
