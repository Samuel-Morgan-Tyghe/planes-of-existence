import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { $health, $maxHealth, $position, heal } from '../../stores/player';

interface HealthPickupProps {
  position: [number, number, number];
  onCollect: () => void;
}

const COLLECT_DISTANCE = 2.0;

export function HealthPickup({ position, onCollect }: HealthPickupProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  
  // Logic Refs
  const isCollectableRef = useRef(false);
  const collectedRef = useRef(false);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    // Small delay before collection is possible (physics settling)
    const timer = setTimeout(() => {
        isCollectableRef.current = true;
    }, 500); 
    return () => clearTimeout(timer);
  }, []);

  const setBodyRef = (body: RapierRigidBody | null) => {
      rigidBodyRef.current = body;
      if (body) {
          // Initial Impulse
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

  useFrame((state, delta) => {
    if (collectedRef.current || !rigidBodyRef.current) return;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3.0) * 0.1;
    }

    const playerPos = $position.get();
    const rbPosition = rigidBodyRef.current.translation();
    
    // Safety check for void
    if (rbPosition.y < -50) {
        rigidBodyRef.current.setTranslation({ x: playerPos[0], y: 5, z: playerPos[2] }, true);
    }
    
    
    const dx = playerPos[0] - rbPosition.x;
    // const dy = playerPos[1] - rbPosition.y; // Unused
    const dz = playerPos[2] - rbPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz); 
    
    // Logic: Only collect if HEALTH < MAX
    if (distance < COLLECT_DISTANCE && isCollectableRef.current) {
        const currentHp = $health.get();
        const maxHp = $maxHealth.get();
        
        if (currentHp < maxHp) {
            collectedRef.current = true;
            setCollected(true);
            heal(20);
            onCollect();
        } else {
            // Push it slightly if full health (feedback)
            // rigidBodyRef.current.applyImpulse({ x: dx * -2, y: 1, z: dz * -2 }, true);
        }
    }
    
    rigidBodyRef.current.setLinearDamping(1.0);
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
        userData={{ type: 'pickup_health' }}
    >
        <CuboidCollider args={[0.3, 0.3, 0.3]} />
        
        {/* Sensor for physics-based contact collection */}
        <BallCollider 
            args={[1.5]} 
            sensor 
            onIntersectionEnter={({ other }) => {
                if (other.rigidBodyObject?.userData?.isPlayer && isCollectableRef.current && !collectedRef.current) {
                    const currentHp = $health.get();
                    const maxHp = $maxHealth.get();
                    
                    if (currentHp < maxHp) {
                        collectedRef.current = true;
                        setCollected(true);
                        heal(20);
                        onCollect();
                    }
                }
            }}
        />

        <mesh ref={meshRef} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial
            color="#ff0044"
            emissive="#ff0044"
            emissiveIntensity={1.0}
          />
        </mesh>

        <pointLight color="#ff0044" intensity={2} distance={3} />

        {/* Label */}
        <Html position={[0, 1.2, 0]} center>
          <div style={{
             color: '#ff0044', fontWeight: 'bold', fontSize: '14px', 
             textShadow: '0 0 5px black'
          }}>
            ♥
          </div>
        </Html>
    </RigidBody>
  );
}
