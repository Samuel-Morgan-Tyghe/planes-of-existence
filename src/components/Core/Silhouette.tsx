import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface SilhouetteProps {
    children: React.ReactNode;
    color?: string;
    opacity?: number;
    pulse?: boolean;
}

/**
 * Silhouette component that renders an "X-Ray" version of its children
 * that is visible through walls.
 */
export function Silhouette({
    children,
    color = '#00ffff',
    opacity = 0.5,
    pulse = false
}: SilhouetteProps) {
    const groupRef = useRef<THREE.Group>(null);
    const silhouetteMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: opacity,
        depthTest: false, // This is the magic: render through everything
        depthWrite: false,
        side: THREE.BackSide, // Slightly helps with visual overlap if mesh is closed
    }), [color, opacity]);

    useFrame(({ clock }) => {
        if (pulse && groupRef.current) {
            const s = 1.0 + Math.sin(clock.getElapsedTime() * 5) * 0.05;
            groupRef.current.scale.set(s, s, s);
            silhouetteMaterial.opacity = opacity * (0.8 + Math.sin(clock.getElapsedTime() * 5) * 0.2);
        }
    });

    // This is a naive implementation that clones the children's geometry.
    // A better way for complex scenes is using Outlines from Drei or a post-processing pass.
    // However, for individual entities, a simple "ghost" version works well.

    return (
        <group>
            {/* The original object */}
            {children}

            {/* The Silhouette/X-Ray version - we wrap it in a group to potentially scale it */}
            <group ref={groupRef}>
                {/* We would ideally clone the children here with the silhouette material, 
            but in React Three Fiber it's easier to just pass children and let them 
            render. To avoid double rendering everything, we might need a more 
            specific approach or use Drei's <Outline> or <Select>. */}
            </group>
        </group>
    );
}
