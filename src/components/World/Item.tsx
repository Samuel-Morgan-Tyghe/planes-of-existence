import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { $hoveredItem } from '../../stores/game';
import { $position } from '../../stores/player';
import { ITEM_DEFINITIONS } from '../../types/items';

interface ItemProps {
  position: [number, number, number];
  itemId: string;
  onCollect: () => void;
}

const COLLECT_DISTANCE = 2.5;
const MAGNET_DISTANCE = 6;
const MAGNET_SPEED = 5;

export function Item({ position, itemId, onCollect }: ItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);

  // Logic Refs (Source of Truth for Physics Loop)
  const isCollectableRef = useRef(false);
  const collectedRef = useRef(false);

  // Local state for unmounting
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      isCollectableRef.current = true;
    }, 1000); // 1 second delay
    return () => {
      clearTimeout(timer);
      if ($hoveredItem.get() === itemId) {
        $hoveredItem.set(null);
      }
    };
  }, []);

  const setBodyRef = (body: RapierRigidBody | null) => {
    rigidBodyRef.current = body;
    if (body) {
      // Initial Impulse (Loot Explosion)
      const angle = Math.random() * Math.PI * 2;
      const force = 3 + Math.random() * 2;
      try {
        body.applyImpulse({
          x: Math.cos(angle) * force,
          y: 5 + Math.random() * 3,
          z: Math.sin(angle) * force
        }, true);
        body.applyTorqueImpulse({
          x: Math.random() - 0.5,
          y: Math.random() - 0.5,
          z: Math.random() - 0.5
        }, true);
      } catch (e) { /* ignore physics errors on unmount */ }
    }
  };

  const itemDef = ITEM_DEFINITIONS[itemId];
  const visualType = itemDef?.visualType || 'range';
  const itemName = itemDef?.name || itemId;

  const getVisuals = () => {
    switch (visualType) {
      case 'range': return { color: '#0088ff', geometry: <torusGeometry args={[0.4, 0.1, 16, 32]} /> };
      case 'rate': return { color: '#ffff00', geometry: <octahedronGeometry args={[0.5]} /> };
      case 'size': return { color: '#00ff00', geometry: <boxGeometry args={[0.6, 0.6, 0.6]} /> };
      case 'damage': return { color: '#ff0000', geometry: <coneGeometry args={[0.4, 0.8, 16]} /> };
      case 'speed': return { color: '#00ffff', geometry: <tetrahedronGeometry args={[0.5]} /> };
      default: return { color: '#ffffff', geometry: <sphereGeometry args={[0.4, 16, 16]} /> };
    }
  };

  const { color, geometry } = getVisuals();

  useFrame((state, delta) => {
    if (collectedRef.current || !rigidBodyRef.current) return;

    // Visual bobbing
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.rotation.x += delta * 1.5;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.0) * 0.2;
    }

    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
    }

    // Magnetism
    const playerPos = $position.get();
    const rbPosition = rigidBodyRef.current.translation();

    // Safety check for NaN or infinite positions (teleport bug)
    if (Math.abs(rbPosition.y) > 500) {
      rigidBodyRef.current.setTranslation({ x: playerPos[0], y: 5, z: playerPos[2] }, true);
    }

    const dx = playerPos[0] - rbPosition.x;
    const dy = playerPos[1] - rbPosition.y;
    const dz = playerPos[2] - rbPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    const canCollect = isCollectableRef.current;

    if (distance < MAGNET_DISTANCE && distance > COLLECT_DISTANCE && canCollect) {
      const strength = 1 - (distance / MAGNET_DISTANCE);
      const force = MAGNET_SPEED * strength * 20.0;

      const dirX = dx / distance;
      const dirZ = dz / distance;

      rigidBodyRef.current.applyImpulse({
        x: dirX * force * delta,
        y: dy * force * delta + 5.0 * delta,
        z: dirZ * force * delta
      }, true);
      rigidBodyRef.current.setLinearDamping(2.0);
    } else {
      rigidBodyRef.current.setLinearDamping(1.0);
    }

    // Hover / Preview Check
    // Show preview only when very close (same as magnet start)
    if (distance < MAGNET_DISTANCE) {
      if ($hoveredItem.get() !== itemId) {
        $hoveredItem.set(itemId);
      }
    } else {
      // If we are the currently hovered item but player moved away, clear it
      if ($hoveredItem.get() === itemId) {
        $hoveredItem.set(null);
      }
    }

    // Distance Collection Check
    if (distance < COLLECT_DISTANCE && canCollect) {
      collectedRef.current = true;
      setCollected(true);
      if ($hoveredItem.get() === itemId) $hoveredItem.set(null);
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
      canSleep={false}
      userData={{ type: 'item' }}
    >
      {/* Physical Collider */}
      <CuboidCollider args={[0.4, 0.4, 0.4]} />

      {/* Backup Sensor Collider for robust collection */}
      <BallCollider
        args={[2.0]}
        sensor
        onIntersectionEnter={({ other }) => {
          const canCollect = isCollectableRef.current;
          const isCollected = collectedRef.current;

          if (other.rigidBodyObject?.userData?.isPlayer && canCollect && !isCollected) {
            collectedRef.current = true;
            setCollected(true);
            if ($hoveredItem.get() === itemId) $hoveredItem.set(null);
            onCollect();
          }
        }}
      />

      <mesh ref={meshRef} castShadow>
        {geometry}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Floating Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
        />
      </mesh>

      <pointLight color={color} intensity={2} distance={5} />

      {/* Item Name Label */}
      <Html position={[0, 1.5, 0]} center>
        <div
          style={{
            backgroundColor: `rgba(0, 0, 0, 0.8)`,
            color: color,
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            border: `1px solid ${color}`,
            pointerEvents: 'none'
          }}
        >
          {itemName}
        </div>
      </Html>
    </RigidBody>
  );
}
