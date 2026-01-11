import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { $currentRoomId } from '../../stores/game';
import { $trails } from '../../stores/trails';

const APP_START_TIME = Date.now();

const VS = `
  attribute vec3 aColor;
  attribute float aSpawnTime;
  attribute float aDuration;
  attribute float aSize;
  
  varying vec3 vColor;
  varying float vOpacity;
  
  uniform float uTime;

  void main() {
    float age = uTime - aSpawnTime; 
    float progress = age / aDuration;
    vOpacity = 1.0 - progress;
    vColor = aColor;

    // Scale logic
    vec3 transformed = position * aSize;
    
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FS = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    if (vOpacity <= 0.0) discard;
    
    // Draw a soft circle
    // UV centered at 0.5, 0.5? No, CircleGeometry has specific UVs.
    // Let's use standard UVs from geometry or implicit generic circle.
    // geometry is CircleGeometry, so UVs are typically 0..1.
    
    gl_FragColor = vec4(vColor, vOpacity * 0.6);
  }
`;

export function InstancedTrails() {
    const trailsMap = useStore($trails);
    const currentRoomId = useStore($currentRoomId);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const activeTrails = useMemo(() => {
        return Object.values(trailsMap).filter(t => t.roomId === currentRoomId);
    }, [trailsMap, currentRoomId]);

    const count = activeTrails.length;

    // Attributes
    const [colorArr, spawnTimeArr, durationArr, sizeArr] = useMemo(() => {
        if (count === 0) return [new Float32Array(0), new Float32Array(0), new Float32Array(0), new Float32Array(0)];

        const cArr = new Float32Array(count * 3);
        const sArr = new Float32Array(count);
        const dArr = new Float32Array(count);
        const zArr = new Float32Array(count);

        activeTrails.forEach((trail, i) => {
            const c = new THREE.Color(trail.type === 'slow' ? '#00f2ff' : '#00ff00');
            if (trail.type === 'toxic') c.set('#39ff14'); // Neon green

            cArr[i * 3] = c.r;
            cArr[i * 3 + 1] = c.g;
            cArr[i * 3 + 2] = c.b;

            sArr[i] = trail.spawnTime - APP_START_TIME;
            dArr[i] = trail.duration;
            zArr[i] = trail.size;
        });

        return [cArr, sArr, dArr, zArr];
    }, [activeTrails]); // Only recalculate when trails list changes

    useLayoutEffect(() => {
        if (!meshRef.current || count === 0) return;

        const tempObj = new THREE.Object3D();
        activeTrails.forEach((trail, i) => {
            // Position
            tempObj.position.set(trail.position[0], 0.02, trail.position[2]);
            // Rotation - Flat on ground
            tempObj.rotation.set(-Math.PI / 2, 0, 0);
            tempObj.scale.set(1, 1, 1);
            tempObj.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObj.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;

        // Update Attributes
        meshRef.current.geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colorArr, 3));
        meshRef.current.geometry.setAttribute('aSpawnTime', new THREE.InstancedBufferAttribute(spawnTimeArr, 1));
        meshRef.current.geometry.setAttribute('aDuration', new THREE.InstancedBufferAttribute(durationArr, 1));
        meshRef.current.geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizeArr, 1));

    }, [activeTrails, count, colorArr, spawnTimeArr, durationArr, sizeArr]);

    useFrame(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = Date.now() - APP_START_TIME;
        }
    });

    if (count === 0) return null;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
            <circleGeometry args={[1, 16]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={VS}
                fragmentShader={FS}
                uniforms={{
                    uTime: { value: 0 }
                }}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </instancedMesh>
    );
}
