import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { $currentRoomId, $drops } from '../../stores/game';
import { $position, $teleportTo } from '../../stores/player';

export function QABot() {
    const drops = useStore($drops);
    const position = useStore($position);
    const roomId = useStore($currentRoomId);

    const [active, setActive] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const actionTimeout = useRef(0);

    useEffect(() => {
        // Expose toggle to window
        (window as any).toggleQA = () => {
            setActive(p => !p);
            console.log('🤖 QA Bot Toggled');
        };
    }, []);

    const addLog = (msg: string) => {
        setLog(prev => [...prev.slice(-4), msg]);
        console.log(`🤖 QA: ${msg}`);
    };

    useFrame((_, delta) => {
        if (!active) return;
        if (actionTimeout.current > 0) {
            actionTimeout.current -= delta;
            return;
        }

        // AI Logic
        // 1. Look for Chests
        const chests = drops.filter(d => d.type === 'chest' && d.roomId === roomId);

        if (chests.length > 0) {
            const target = chests[0];
            const dist = Math.sqrt(
                Math.pow(target.position[0] - position[0], 2) +
                Math.pow(target.position[2] - position[2], 2)
            );

            if (dist > 1.5) {
                // Teleport to chest
                addLog(`Teleporting to Chest ${target.id}`);
                $teleportTo.set([target.position[0], 0.5, target.position[2]]);
                actionTimeout.current = 0.5; // Wait for physics
            } else {
                // Already near, should have collected?
                // Maybe we need to wiggle
                addLog(`Wiggling near Chest...`);
                $teleportTo.set([target.position[0] + 0.1, 0.5, target.position[2]]);
                actionTimeout.current = 1.0;
            }
        } else {
            // No chests
            // Look for other drops
            const otherDrops = drops.filter(d => d.roomId === roomId);
            if (otherDrops.length > 0) {
                const target = otherDrops[0];
                addLog(`Collecting ${target.type}...`);
                $teleportTo.set([target.position[0], 0.5, target.position[2]]);
                actionTimeout.current = 0.2;
            } else {
                // Nothing to do
                // Maybe spawn a chest?
                if (Math.random() < 0.01) { // Occasional spawn
                    // Can't easily spawn from here without importing actions, 
                    // but we can just wait.
                    addLog("Waiting for drops...");
                    actionTimeout.current = 1.0;
                }
            }
        }
    });

    if (!active) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.8)',
            color: '#0f0',
            padding: '10px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 9999
        }}>
            <h3>🤖 QA BOT ACTIVE</h3>
            {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
    );
}
