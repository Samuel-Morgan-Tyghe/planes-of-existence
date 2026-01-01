import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { $enemyProjectiles, projectileBodies, removeEnemyProjectile } from '../../stores/projectiles';
import { EnemyProjectile } from './EnemyProjectile';
import { SoundWave } from './SoundWave';

const MAX_PROJECTILES = 1000;
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export function ProjectileManager() {
  const projectiles = useStore($enemyProjectiles);
  const normalMeshRef = useRef<THREE.InstancedMesh>(null);
  const soundwaveMeshRef = useRef<THREE.InstancedMesh>(null);

  // Geometries and Materials
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.5, 8, 8), []);
  const torusGeo = useMemo(() => new THREE.TorusGeometry(0.5, 0.15, 8, 16), []); // Lower poly for optimization
  
  const normalMat = useMemo(() => new THREE.MeshStandardMaterial({
    emissiveIntensity: 4,
    toneMapped: false
  }), []);

  const soundwaveMat = useMemo(() => new THREE.MeshStandardMaterial({
    emissiveIntensity: 4,
    transparent: true,
    opacity: 0.8,
    toneMapped: false
  }), []);

  useFrame((state) => {
    const normalMesh = normalMeshRef.current;
    const soundwaveMesh = soundwaveMeshRef.current;
    
    if (!normalMesh || !soundwaveMesh) return;

    let normalCount = 0;
    let soundwaveCount = 0;

    // Iterate through all active projectiles in the store
    // Use the store directly to get data, and projectileBodies map for physics position
    const projectileList = Object.values($enemyProjectiles.get());

    for (const proj of projectileList) {
      const rb = projectileBodies.get(proj.id);
      if (!rb) continue; // Physics body might not be ready yet

      const position = rb.translation();
      // Rotation logic: 
      // Normal projectiles usually just facing direction or spherical (rotation doesn't matter for sphere)
      // Soundwaves are flat, so they might need rotation. 
      // SoundWave.tsx had: rotation={[Math.PI / 2, 0, 0]} on the mesh.
      
      tempObject.position.set(position.x, position.y, position.z);
      tempObject.rotation.set(0, 0, 0); // Reset rotation
      tempObject.scale.set(1, 1, 1); // Reset scale

      const color = proj.color || '#ff0000';
      tempColor.set(color);

      // Apply size modifier if present
      const scale = proj.size || 1.0;

      if (proj.type === 'soundwave') {
        // Soundwave specific logic
        // Original SoundWave had rotation={[Math.PI / 2, 0, 0]} to lay flat? Or face camera?
        // Actually it moved in 'direction'. 
        // The original component had: <mesh rotation={[Math.PI / 2, 0, 0]}> which rotates X by 90 deg.
        // If direction is in X/Z plane, torus lies flat on Y? 
        // Let's replicate the original mesh rotation.
        tempObject.rotation.x = Math.PI / 2;

        // Pulsing effect
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
        const finalScale = scale * pulse;
        tempObject.scale.set(finalScale, finalScale, finalScale);

        soundwaveMesh.setMatrixAt(soundwaveCount, tempObject.matrix);
        soundwaveMesh.setColorAt(soundwaveCount, tempColor);
        soundwaveCount++;
      } else {
        // Normal projectile
        tempObject.scale.set(scale, scale, scale);
        
        normalMesh.setMatrixAt(normalCount, tempObject.matrix);
        normalMesh.setColorAt(normalCount, tempColor);
        normalCount++;
      }
    }

    normalMesh.count = normalCount;
    soundwaveMesh.count = soundwaveCount;
    
    // Important: mark updates
    normalMesh.instanceMatrix.needsUpdate = true;
    if (normalMesh.instanceColor) normalMesh.instanceColor.needsUpdate = true;
    
    soundwaveMesh.instanceMatrix.needsUpdate = true;
    if (soundwaveMesh.instanceColor) soundwaveMesh.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh
        ref={normalMeshRef}
        args={[sphereGeo, normalMat, MAX_PROJECTILES]}
        castShadow
      />
      <instancedMesh
        ref={soundwaveMeshRef}
        args={[torusGeo, soundwaveMat, MAX_PROJECTILES]}
      />

      {/* Render Physics Controllers (Headless) */}
      {Object.values(projectiles).map((proj) => (
        proj.type === 'soundwave' ? (
          <SoundWave
            key={proj.id}
            id={proj.id}
            origin={proj.origin}
            direction={proj.direction}
            speed={proj.speed}
            damage={proj.damage}
            color={proj.color}
            onDestroy={() => removeEnemyProjectile(proj.id)}
          />
        ) : (
          <EnemyProjectile
            key={proj.id}
            id={proj.id}
            origin={proj.origin}
            direction={proj.direction}
            speed={proj.speed}
            damage={proj.damage}
            color={proj.color}
            onDestroy={() => removeEnemyProjectile(proj.id)}
          />
        )
      ))}
    </>
  );
}
