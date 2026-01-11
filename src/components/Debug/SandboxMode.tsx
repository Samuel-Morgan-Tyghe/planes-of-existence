import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useEffect, useState } from 'react';
import { BOSS_DEFINITIONS, ENEMY_DEFINITIONS } from '../../types/enemies';
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

function SandboxControls({ onSpawn, onClear }: { onSpawn: (id: string) => void, onClear: () => void }) {
    const enemies = Object.values(ENEMY_DEFINITIONS);
    const bosses = Object.values(BOSS_DEFINITIONS);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '250px',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '20px',
            overflowY: 'auto',
            zIndex: 1000,
            borderRight: '1px solid #444'
        }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #666', paddingBottom: '0.5rem' }}>Sandbox Controls</h2>

            <button
                onClick={onClear}
                style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '20px',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                Clear All
            </button>

            <h3 style={{ fontSize: '1rem', color: '#aaa', marginBottom: '10px' }}>Enemies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {enemies.map(e => (
                    <button
                        key={e.id}
                        onClick={() => onSpawn(e.id)}
                        style={{
                            padding: '6px 12px',
                            background: '#333',
                            border: '1px solid #555',
                            color: '#eee',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#444'}
                        onMouseLeave={e => e.currentTarget.style.background = '#333'}
                    >
                        {e.name}
                    </button>
                ))}
            </div>

            <h3 style={{ fontSize: '1rem', color: '#aaa', marginBottom: '10px' }}>Bosses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bosses.map(b => (
                    <button
                        key={b.id}
                        onClick={() => onSpawn(b.id)}
                        style={{
                            padding: '6px 12px',
                            background: '#4a3b5c', // Purplish for bosses
                            border: '1px solid #6a5acd',
                            color: '#eee',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#5c4b70'}
                        onMouseLeave={e => e.currentTarget.style.background = '#4a3b5c'}
                    >
                        {b.name}
                    </button>
                ))}
            </div>
        </div>
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
            </Canvas>
        </div>
    );
}
