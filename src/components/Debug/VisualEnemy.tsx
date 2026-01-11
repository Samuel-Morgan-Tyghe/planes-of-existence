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
