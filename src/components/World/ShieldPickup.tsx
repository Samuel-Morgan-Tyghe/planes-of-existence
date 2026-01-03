import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { $maxShield, $position, $shield, addShield } from '../../stores/player';

interface ShieldPickupProps {
  position: [number, number, number];
  onCollect: () => void;
}

const COLLECT_DISTANCE = 2.0;

export function ShieldPickup({ position, onCollect }: ShieldPickupProps) {
  const meshRef = useRef<THREE.Mesh>(null);
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
      meshRef.current.rotation.x += delta;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3.0) * 0.1;
    }

    const playerPos = $position.get();
    const rbPosition = rigidBodyRef.current.translation();
    
    if (rbPosition.y < -50) {
        rigidBodyRef.current.setTranslation({ x: playerPos[0], y: 5, z: playerPos[2] }, true);
    }
    
    const dx = playerPos[0] - rbPosition.x;
    // const dy = playerPos[1] - rbPosition.y; 
    const dz = playerPos[2] - rbPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz); 
    
    // Logic: Only collect if SHIELD < MAX
    if (distance < COLLECT_DISTANCE && isCollectableRef.current) {
        const currentShield = $shield.get();
        const maxShield = $maxShield.get();
        
        if (currentShield < maxShield) {
            collectedRef.current = true;
            setCollected(true);
            addShield(25);
            onCollect();
        } else {
             // Push back feedback
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
        userData={{ type: 'pickup_shield' }}
    >
        <CuboidCollider args={[0.3, 0.3, 0.3]} />
        
        <BallCollider 
            args={[1.5]} 
            sensor 
            onIntersectionEnter={({ other }) => {
                if (other.rigidBodyObject?.userData?.isPlayer && isCollectableRef.current && !collectedRef.current) {
                    const currentShield = $shield.get();
                    const maxShield = $maxShield.get();
                    
                    if (currentShield < maxShield) {
                        collectedRef.current = true;
                        setCollected(true);
                        addShield(25);
                        onCollect();
                    }
                }
            }}
        />

        <mesh ref={meshRef} castShadow>
          <octahedronGeometry args={[0.5]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={1.0}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        <pointLight color="#00ffff" intensity={2} distance={3} />

        <Html position={[0, 1.2, 0]} center>
          <div style={{
             color: '#00ffff', fontWeight: 'bold', fontSize: '14px', 
             textShadow: '0 0 5px black', border: '1px solid #00ffff',
             padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            SHIELD
          </div>
        </Html>
    </RigidBody>
  );
}
