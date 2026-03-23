import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const ParticleSphere = () => {
  const points = useMemo(() => {
    const p = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const distance = 2.5 + Math.random() * 0.5;
      p[i * 3] = distance * Math.sin(theta) * Math.cos(phi);
      p[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
      p[i * 3 + 2] = distance * Math.cos(theta);
    }
    return p;
  }, []);

  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={ref}>
      <Points positions={points} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#22d3ee"
          size={0.025}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.6}
        />
      </Points>
    </group>
  );
};

const CognitiveCore = () => {
  const mesh = useRef();
  
  useFrame((state) => {
    if (mesh.current) {
      const t = state.clock.getElapsedTime();
      mesh.current.distort = THREE.MathUtils.lerp(mesh.current.distort, 0.2 + Math.sin(t * 0.5) * 0.1, 0.05);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <Sphere args={[1, 64, 64]} scale={0.7}>
        <MeshDistortMaterial
          ref={mesh}
          color="#06b6d4"
          speed={1.5}
          distort={0.2}
          radius={1}
          emissive="#22d3ee"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </Sphere>
    </Float>
  );
};

const AgentOrbits = () => {
  const group = useRef();
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y += 0.003;
    }
  });

  const agents = [
    { color: '#10b981', pos: [2.5, 0.5, 0], label: 'Evaluator', size: 0.18 },
    { color: '#8b5cf6', pos: [-2.2, 1.8, 0], label: 'Strategy', size: 0.16 },
    { color: '#f59e0b', pos: [0.5, -2.4, 0], label: 'Teacher', size: 0.2 },
    { color: '#3b82f6', pos: [-2, -1.5, 0], label: 'Mastery', size: 0.15 },
    { color: '#ec4899', pos: [1.8, 2.2, 0], label: 'Analyst', size: 0.14 }
  ];

  return (
    <group ref={group}>
      {agents.map((agent, i) => (
        <Float key={i} speed={3} rotationIntensity={0.8} floatIntensity={1}>
          <group position={agent.pos}>
            <mesh>
              <sphereGeometry args={[agent.size, 32, 32]} />
              <meshStandardMaterial 
                color={agent.color} 
                emissive={agent.color} 
                emissiveIntensity={4} 
              />
            </mesh>
            <pointLight 
              color={agent.color} 
              intensity={2.5} 
              distance={4} 
              decay={2}
            />
            {/* Inner Glow Sphere */}
            <mesh scale={1.3}>
              <sphereGeometry args={[agent.size, 16, 16]} />
              <meshBasicMaterial color={agent.color} transparent opacity={0.15} />
            </mesh>
          </group>
        </Float>
      ))}
      
      {/* Orbital structure */}
      <group rotation={[Math.PI / 2.5, 0, 0]}>
        <mesh>
          <ringGeometry args={[2.45, 2.5, 64]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[1.95, 2, 64]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

const ThreeHeroVisual = () => {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#06b6d4" />
        <spotLight position={[0, 5, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow />
        
        <CognitiveCore />
        <ParticleSphere />
        <AgentOrbits />
      </Canvas>
      
      {/* Agent Identification Overlays */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[18%] left-[22%] animate-pulse">
          <div className="bg-slate-900/60 backdrop-blur-md border border-purple-500/40 px-3 py-1.5 rounded-full text-[9px] text-purple-300 font-black uppercase tracking-widest shadow-lg shadow-purple-500/10">
            Strategy Agent
          </div>
        </div>
        <div className="absolute top-[32%] right-[18%] animate-pulse [animation-delay:1s]">
          <div className="bg-slate-900/60 backdrop-blur-md border border-emerald-500/40 px-3 py-1.5 rounded-full text-[9px] text-emerald-300 font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10">
            Evaluator Node
          </div>
        </div>
        <div className="absolute top-[5%] right-[40%] animate-pulse [animation-delay:2s]">
          <div className="bg-slate-900/60 backdrop-blur-md border border-pink-500/40 px-3 py-1.5 rounded-full text-[9px] text-pink-300 font-black uppercase tracking-widest shadow-lg shadow-pink-500/10">
            Analyst Engine
          </div>
        </div>
        <div className="absolute bottom-[25%] left-[25%] animate-pulse [animation-delay:0.5s]">
          <div className="bg-slate-900/60 backdrop-blur-md border border-blue-500/40 px-3 py-1.5 rounded-full text-[9px] text-blue-300 font-black uppercase tracking-widest shadow-lg shadow-blue-500/10">
            Mastery Hub
          </div>
        </div>
        <div className="absolute bottom-[20%] right-[30%] animate-pulse [animation-delay:1.5s]">
          <div className="bg-slate-900/60 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-full text-[9px] text-amber-300 font-black uppercase tracking-widest shadow-lg shadow-amber-500/10">
            Teacher Pilot
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeHeroVisual;
