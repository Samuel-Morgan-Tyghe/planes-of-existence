import { CuboidCollider, RigidBody } from '@react-three/rapier';

export function ArenaRoom() {
    const size = 30; // Large arena
    const h = size / 2;

    return (
        <group>
            {/* Floor */}
            <RigidBody type="fixed" colliders="cuboid" friction={1} position={[0, -0.5, 0]}>
                <CuboidCollider args={[h, 0.5, h]} />
                <mesh receiveShadow>
                    <boxGeometry args={[size, 1, size]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            </RigidBody>

            {/* Wall -Z */}
            <RigidBody type="fixed" colliders="cuboid" position={[0, 2, -h]}>
                <CuboidCollider args={[h, 2, 1]} />
                <mesh receiveShadow>
                    <boxGeometry args={[size, 4, 1]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
            </RigidBody>

            {/* Wall +Z */}
            <RigidBody type="fixed" colliders="cuboid" position={[0, 2, h]}>
                <CuboidCollider args={[h, 2, 1]} />
                <mesh receiveShadow>
                    <boxGeometry args={[size, 4, 1]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
            </RigidBody>

            {/* Wall -X */}
            <RigidBody type="fixed" colliders="cuboid" position={[-h, 2, 0]}>
                <CuboidCollider args={[1, 2, h]} />
                <mesh receiveShadow>
                    <boxGeometry args={[1, 4, size]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
            </RigidBody>

            {/* Wall +X */}
            <RigidBody type="fixed" colliders="cuboid" position={[h, 2, 0]}>
                <CuboidCollider args={[1, 2, h]} />
                <mesh receiveShadow>
                    <boxGeometry args={[1, 4, size]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
            </RigidBody>
        </group>
    );
}
