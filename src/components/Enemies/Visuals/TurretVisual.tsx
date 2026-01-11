
interface VisualProps {
    color: string;
    size: number;
}

/**
 * Turret Style:
 * A static base (Cone/Pyramid) with a floating head (Sphere/Icosahedron)
 * and a barrel (Cylinder) pointing forward.
 */
export function TurretVisual({ color, size }: VisualProps) {
    // const halfSize = size / 2; // Unused

    return (
        <group>
            {/* Base: Stable Pyramid */}
            <mesh position={[0, size * 0.25, 0]} castShadow receiveShadow>
                <coneGeometry args={[size * 0.4, size * 0.5, 4]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>

            {/* Head: Floating "Eye" */}
            <group position={[0, size * 0.7, 0]}>
                <mesh castShadow receiveShadow>
                    <icosahedronGeometry args={[size * 0.3, 0]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                </mesh>

                {/* Barrel: Cylinder pointing +Z (Forward) */}
                <mesh position={[0, 0, size * 0.4]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[size * 0.1, size * 0.1, size * 0.6, 8]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
            </group>
        </group>
    );
}
