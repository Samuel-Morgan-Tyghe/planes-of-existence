import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $position } from '../../stores/player';
import { $currentFloor, $currentRoomId } from '../../stores/game';
import { $restartTrigger } from '../../stores/restart';
import type { Drop } from '../../types/drops';
import { rollDrop } from '../../types/drops';
import { Key } from './Key';
import { Bomb } from './Bomb';
import { Chest } from './Chest';

interface DropManagerProps {
  onEnemySpawn?: (position: [number, number, number], count: number) => void;
}

export function DropManager({ onEnemySpawn }: DropManagerProps) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [keysCollected, setKeysCollected] = useState(0);
  const [bombsCollected, setBombsCollected] = useState(0);
  const playerPosition = useStore($position);
  const currentFloor = useStore($currentFloor);
  const currentRoomId = useStore($currentRoomId);
  const restartTrigger = useStore($restartTrigger);

  // Clear drops when room changes or restart
  useEffect(() => {
    setDrops([]);
  }, [currentFloor, currentRoomId, restartTrigger]);

  // Listen for enemy deaths via global handler
  useEffect(() => {
    let dropIdCounter = 0;

    const handleEnemyDeath = (position: [number, number, number]) => {
      const dropResult = rollDrop();

      if (!dropResult) {
        console.log('🎲 No drop this time');
        return;
      }

      console.log(`🎲 Drop rolled: ${dropResult.type}`, dropResult);

      if (dropResult.type === 'enemy_spawn') {
        // Spawn enemies immediately using global spawn function
        console.log(`👹 Spawning ${dropResult.spawnCount} enemies at drop location!`);
        if ((window as any).__spawnEnemiesAt) {
          (window as any).__spawnEnemiesAt(position, dropResult.spawnCount || 1);
        }
      } else {
        // Create pickup item
        const newDrop: Drop = {
          id: dropIdCounter++,
          type: dropResult.type,
          position,
        };

        // Store chest variety in the drop object
        if (dropResult.type === 'chest') {
          (newDrop as any).variety = dropResult.chestVariety || 1;
        }

        setDrops((prev) => [...prev, newDrop]);
      }
    };

    (window as any).__handleEnemyDrop = handleEnemyDeath;

    return () => {
      delete (window as any).__handleEnemyDrop;
    };
  }, [onEnemySpawn]);

  const handleCollectKey = (id: number) => {
    setDrops((prev) => prev.filter((d) => d.id !== id));
    setKeysCollected((prev) => prev + 1);
    console.log(`🔑 Total keys: ${keysCollected + 1}`);
  };

  const handleCollectBomb = (id: number) => {
    setDrops((prev) => prev.filter((d) => d.id !== id));
    setBombsCollected((prev) => prev + 1);
    console.log(`💣 Total bombs: ${bombsCollected + 1}`);
  };

  const handleCollectChest = (id: number, variety: number) => {
    setDrops((prev) => prev.filter((d) => d.id !== id));
    console.log(`💎 Chest opened with ${variety} items!`);
    // TODO: Give player items
  };

  return (
    <>
      {drops.map((drop) => {
        if (drop.type === 'key') {
          return (
            <Key
              key={drop.id}
              position={drop.position}
              playerPosition={playerPosition}
              onCollect={() => handleCollectKey(drop.id)}
            />
          );
        } else if (drop.type === 'bomb') {
          return (
            <Bomb
              key={drop.id}
              position={drop.position}
              playerPosition={playerPosition}
              onCollect={() => handleCollectBomb(drop.id)}
            />
          );
        } else if (drop.type === 'chest') {
          return (
            <Chest
              key={drop.id}
              position={drop.position}
              variety={(drop as any).variety || 1}
              playerPosition={playerPosition}
              onCollect={() => handleCollectChest(drop.id, (drop as any).variety || 1)}
            />
          );
        }
        return null;
      })}
    </>
  );
}
