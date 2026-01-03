import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { $position } from '../../stores/player';

interface KeyProps {
  position: [number, number, number];
  onCollect: () => void;
}

const COLLECT_DISTANCE = 2;
const MAGNET_DISTANCE = 6;
const MAGNET_SPEED = 5;

export function Key({ position, onCollect }: KeyProps) {
  const meshRef = useRef<THREE.Group>(null);
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  
  // Logic Refs
  const isCollectableRef = useRef(false);
  const collectedRef = useRef(false);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        isCollectableRef.current = true;
    }, 500); 
    return () => clearTimeout(timer);
  }, []);

  const setBodyRef = (body: RapierRigidBody | null) => {
      rigidBodyRef.current = body;
      if (body) {
          // Initial Impulse (Loot Explosion)
          const angle = Math.random() * Math.PI * 2;
          const force = 4 + Math.random() * 2;
          try {
            body.applyImpulse({ 
                x: Math.cos(angle) * force, 
                y: 6 + Math.random() * 3, 
                z: Math.sin(angle) * force 
            }, true);
            body.applyTorqueImpulse({ 
                x: Math.random() - 0.5, 
                y: Math.random() - 0.5, 
                z: Math.random() - 0.5 
            }, true);
          } catch(e) { /* ignore */ }
      }
  };

  useFrame((_, delta) => {
    if (collectedRef.current || !rigidBodyRef.current) return;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
    }

    const playerPos = $position.get();
    const rbPosition = rigidBodyRef.current.translation();
    
    // Safety check for void
    if (rbPosition.y < -50) {
        rigidBodyRef.current.setTranslation({ x: playerPos[0], y: 5, z: playerPos[2] }, true);
    }
    
    const dx = playerPos[0] - rbPosition.x;
    const dy = playerPos[1] - rbPosition.y;
    const dz = playerPos[2] - rbPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz); 
    
    // Magnetism
    if (distance < MAGNET_DISTANCE && distance > COLLECT_DISTANCE && isCollectableRef.current) {
        const strength = 1 - (distance / MAGNET_DISTANCE);
        const force = MAGNET_SPEED * strength * 20.0;
        
        rigidBodyRef.current.applyImpulse({
          x: (dx / distance) * force * delta,
          y: dy * force * delta + 5.0 * delta,
          z: (dz / distance) * force * delta
        }, true);
        rigidBodyRef.current.setLinearDamping(2.0);
    } else {
        rigidBodyRef.current.setLinearDamping(1.0);
    }

    // Distance Check
    if (distance < COLLECT_DISTANCE && isCollectableRef.current) {
        collectedRef.current = true;
        setCollected(true);
        console.log('🔑 Key collected!');
        onCollect();
    }
  });

  if (collected) return null;

  return (
    <RigidBody 
        ref={setBodyRef}
        position={position}
        type="dynamic"
        colliders={false}
        linearDamping={1.0}
        angularDamping={1.0}
        restitution={0.6}
        friction={0.5}
        userData={{ type: 'pickup_key' }}
    >
        <CuboidCollider args={[0.2, 0.4, 0.2]} />
        
        {/* Sensor */}
        <BallCollider 
            args={[1.5]} 
            sensor 
            onIntersectionEnter={({ other }) => {
                if (other.rigidBodyObject?.userData?.isPlayer && isCollectableRef.current && !collectedRef.current) {
                    collectedRef.current = true;
                    setCollected(true);
                    console.log('🔑 Key collected!');
                    onCollect();
                }
            }}
        />

      <group ref={meshRef}>
        {/* Key body */}
        <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
            <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2.0} />
        </mesh>
        {/* Key head */}
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
             <torusGeometry args={[0.15, 0.05, 8, 16]} />
             <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2.0} />
        </mesh>

        <pointLight color="#ffff00" intensity={2} distance={3} />
        
        <Html position={[0, 1.2, 0]} center>
          <div style={{
             color: '#ffff00', fontWeight: 'bold', fontSize: '14px', 
             textShadow: '0 0 5px black', border: '1px solid #ffff00',
             padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            KEY
          </div>
        </Html>
      </group>
    </RigidBody>
  );
}
