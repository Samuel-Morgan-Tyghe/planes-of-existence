import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import { addTrail } from '../../stores/trails';
import { ENEMY_DEFINITIONS } from '../../types/enemies';
import { EnemyVisuals } from '../Enemies/Visuals/EnemyVisuals';

interface VisualEnemyProps {
    id: string; // Enemy Definition ID (e.g. "glitch_basic")
    position: [number, number, number];
}

/**
 * Visual-only representation of an enemy for Sandbox/Visual Testing.
 * Renders the exact same mesh hierarchy as Enemy.tsx but without physics/logic/stores.
 */
export function VisualEnemy({ id, position }: VisualEnemyProps) {
    const definition = ENEMY_DEFINITIONS[id];

    // Simulate Trail for Slimes in Sandbox
    useFrame((state) => {
        if (!definition) return;
        if (definition.id.startsWith('slime_')) {
            // Only emit once per second to avoid spamming in sandbox
            const time = state.clock.elapsedTime;
            if (Math.floor(time * 2) % 2 === 0) { // Simple interval check
                // We don't have unique IDs per visual enemy ref here easily without state, 
                // but for visual snapshot this is fine.
                // Actually, let's just emit one static trail under it.
            }
        }
    });

    // Better: Just spawn a trail ONCE on mount if it's a slime, so snapshot captures it.
    useEffect(() => {
        if (definition?.id.startsWith('slime_')) {
            addTrail(
                position,
                definition.id === 'slime_slow' ? 'slow' : 'toxic',
                definition.size * 0.5,
                999999, // Infinite duration for sandbox
                0 // Room 0
            );
        }
    }, [definition, position]);

    if (!definition) {
        return (
            <group position={position}>
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="magenta" />
                </mesh>
            </group>
        );
    }

    const { size } = definition;
    const healthPercent = 100; // Always show full health

    return (
        <group position={position}>
            {/* Visuals Component */}
            <group position={[0, size / 2, 0]}>
                <EnemyVisuals definition={definition} healthPercent={healthPercent} />
            </group>

            {/* Health Bar (Legacy/Overlay style) */}
            <group position={[0, size + 0.8, 0]}>
                <mesh><boxGeometry args={[0.6, 0.05, 0.05]} /><meshStandardMaterial color="black" /></mesh>
                <mesh position={[-0.3 + (healthPercent / 100) * 0.3, 0, 0.01]}><boxGeometry args={[(healthPercent / 100) * 0.6, 0.05, 0.05]} /><meshStandardMaterial color="green" /></mesh>
            </group>
        </group>
    );
}
