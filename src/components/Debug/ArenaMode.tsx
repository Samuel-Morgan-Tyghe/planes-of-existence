import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect } from 'react';
import { $currentRoomId, $enemies } from '../../stores/game';
import { $position } from '../../stores/player';
import { BOSS_DEFINITIONS, ENEMY_DEFINITIONS } from '../../types/enemies';
import { Scene } from '../Core/Scene';
import { HUD } from '../UI/HUD';
import { SandboxControls } from './SandboxControls';

export function ArenaMode() {
    const spawnEnemy = useCallback((id: string, isBoss: boolean = false) => {
        const def = isBoss ? BOSS_DEFINITIONS[id] : ENEMY_DEFINITIONS[id];
        if (!def) return;

        // Spawn 10 units away from player in random dir
        const angle = Math.random() * Math.PI * 2;
        const dist = isBoss ? 15 : 8;
        const playerPos = $position.get();
        const spawnPos: [number, number, number] = [
            playerPos[0] + Math.cos(angle) * dist,
            0.5,
            playerPos[2] + Math.sin(angle) * dist
        ];

        const newEnemy = {
            id: Date.now() + Math.random(), // Unique ID
            roomId: 0, // Arena is always room 0
            definition: def,
            health: def.health,
            position: spawnPos,
            isDead: false,
            spawnTime: Date.now()
        };

        const currentEnemies = $enemies.get();
        $enemies.set([...currentEnemies, newEnemy]);
    }, []);

    const clearEnemies = useCallback(() => {
        $enemies.set([]);
    }, []);

    // Setup global bridge for manual testing if needed
    useEffect(() => {
        (window as any).sandbox = {
            spawn: (_type: string, id: string) => spawnEnemy(id, false),
            clear: clearEnemies
        };
    }, [spawnEnemy, clearEnemies]);

    // Initial Cleanup and Spawn
    useEffect(() => {
        $enemies.set([]);
        $currentRoomId.set(0); // Ensure we are in Room 0 for arena

        // Parse URL param for specific enemy spawn
        const params = new URLSearchParams(window.location.search);
        const forcedEnemy = params.get('spawn');

        if (forcedEnemy) {
            const def = ENEMY_DEFINITIONS[forcedEnemy] || ENEMY_DEFINITIONS['turret'];
            $enemies.set([{
                id: Date.now(),
                roomId: 0,
                definition: def,
                position: [0, 0, -5], // Fixed position for testing
                health: def.health,
                isDead: false,
                spawnTime: Date.now()
            }]);
        }
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#111' }}>
            {/* Overlay UI */}
            <SandboxControls onSpawn={spawnEnemy} onClear={clearEnemies} />

            <Canvas shadows camera={{ position: [0, 15, 10], fov: 50 }}>
                {/* Game Scene in Arena Mode */}
                <Scene mode="arena" />
            </Canvas>

            {/* HUD is optional but good for testing (HP bar etc) */}
            <HUD />
        </div>
    );
}
