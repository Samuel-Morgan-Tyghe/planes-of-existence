import { useFrame } from '@react-three/fiber';
import React, { useRef } from 'react';
import * as THREE from 'three';
import { SnakeSegment } from '../../../logic/enemies/boss_mega_snake';

interface SnakeBodyProps {
    segmentsRef: React.MutableRefObject<SnakeSegment[]>;
    color: string;
    size: number;
}

export function SnakeBody({ segmentsRef, color, size }: SnakeBodyProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const tempObject = new THREE.Object3D();

    useFrame(() => {
        if (!meshRef.current) return;

        const segments = segmentsRef.current;
        if (segments.length === 0) {
            meshRef.current.count = 0;
            return;
        }

        // Update instance count if needed (though usually fixed buffer size is better)
        // We'll cap at 100 segments for now
        const count = Math.min(segments.length, 100);
        meshRef.current.count = count;

        for (let i = 0; i < count; i++) {
            const segment = segments[i];
            tempObject.position.set(segment.position[0], segment.position[1], segment.position[2]);

            // Scale down slightly for tail effect?
            const scale = size * 0.8;
            tempObject.scale.set(scale, scale, scale);

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 100]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </instancedMesh>
    );
}
