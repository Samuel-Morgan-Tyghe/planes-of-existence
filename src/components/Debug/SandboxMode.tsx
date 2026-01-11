import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useEffect, useState } from 'react';
import { InstancedTrails } from '../World/InstancedTrails';
import { SandboxControls } from './SandboxControls';
import { VisualEnemy } from './VisualEnemy';

// Sandbox Mode: Visual Fidelity Setup
// Replicates a single room environment and uses VisualEnemy for safe rendering.

export type SandboxEntity = {
    type: 'enemy' | 'item';
    id: string; // "glitch_basic", etc
    instanceId: number;
    position: [number, number, number];
};

function SandboxRoom() {
    const size = 15;
    const half = size / 2;
    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
            {/* Walls (Visual only) */}
            <mesh position={[0, 2, -half]} receiveShadow castShadow>
                <boxGeometry args={[size, 4, 1]} />
                <meshStandardMaterial color="#222222" />
            </mesh>
            <mesh position={[0, 2, half]} receiveShadow castShadow>
                <boxGeometry args={[size, 4, 1]} />
                <meshStandardMaterial color="#222222" />
            </mesh>
            <mesh position={[-half, 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[1, 4, size]} />
                <meshStandardMaterial color="#222222" />
            </mesh>
            <mesh position={[half, 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[1, 4, size]} />
                <meshStandardMaterial color="#222222" />
            </mesh>
        </group>
    );
}

export function SandboxMode() {
    const [entities, setEntities] = useState<SandboxEntity[]>([]);
    const [cameraConfig, setCameraConfig] = useState({
        position: [0, 10, 10] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
    });

    const idCounter = React.useRef(0);

    const spawnEntity = (type: 'enemy', id: string, position: [number, number, number]) => {
        console.log("Sandbox Spawn:", type, id);
        setEntities(prev => [
            ...prev,
            { type, id, instanceId: idCounter.current++, position }
        ]);
    };

    const clearEntities = () => setEntities([]);

    useEffect(() => {
        console.log("SandboxMode Mounted");
        (window as any).sandbox = {
            spawn: spawnEntity,
            clear: clearEntities,
            setCamera: (position: [number, number, number], target: [number, number, number]) => {
                setCameraConfig({ position, target });
            }
        };
        return () => {
            // Cleanup if needed
        };
    }, []);

    const isTestMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('test') === 'true' : false;

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#111', position: 'relative' }}>
            {!isTestMode && (
                <SandboxControls
                    onSpawn={(id) => spawnEntity('enemy', id, [0, 0, 0])}
                    onClear={clearEntities}
                />
            )}

            <Canvas shadows>
                <PerspectiveCamera makeDefault position={cameraConfig.position} fov={50} />
                <OrbitControls target={cameraConfig.target} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

                <SandboxRoom />

                {entities.map(entity => (
                    <VisualEnemy
                        key={entity.instanceId}
                        id={entity.id}
                        position={entity.position}
                    />
                ))}

                <InstancedTrails />
            </Canvas>
        </div>
    );
}
