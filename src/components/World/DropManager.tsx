import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { rollDrop, rollRoomClearLoot } from '../../logic/loot';
import { $coins, $currentFloor, $currentRoomId, $drops, addItem } from '../../stores/game';
import { $restartTrigger } from '../../stores/restart';
import { $dropEvents, $roomClearEvents } from '../../systems/events';
import { Drop } from '../../types/drops';
import { Bomb } from './Bomb';
import { Chest } from './Chest';
import { Coin } from './Coin';
import { HealthPickup } from './HealthPickup';
import { Item } from './Item';
import { Key } from './Key';
import { ShieldPickup } from './ShieldPickup';

interface DropManagerProps {
  // onEnemySpawn removed as it was unused
}

export function DropManager({ }: DropManagerProps) {
  const currentFloor = useStore($currentFloor);
  const currentRoomId = useStore($currentRoomId);
  const restartTrigger = useStore($restartTrigger);
  const drops = useStore($drops);

  // Clear drops when floor changes or restart
  useEffect(() => {
    $drops.set([]);
  }, [currentFloor, restartTrigger]);

  const dropEvents = useStore($dropEvents);
  const roomClearEvents = useStore($roomClearEvents);

  // Handle individual enemy drops
  useEffect(() => {
    if (!dropEvents) return;

    const { position, roomId, forcedType, forcedItem } = dropEvents;

    if (forcedItem) {
      // Force drop specific item
      const newDrop: Drop = {
        id: Date.now() + Math.random(),
        type: 'item',
        position,
        roomId,
      };
      (newDrop as any).itemId = forcedItem;
      $drops.set([...$drops.get(), newDrop]);
      console.log(`🎁 Forced item drop: ${forcedItem} in room ${roomId}`);
      return;
    }

    if (forcedType) {
      // Force drop specific type (health, shield, coin, etc.)
      const newDrop: Drop = {
        id: Date.now() + Math.random(),
        type: forcedType,
        position,
        roomId,
      };
      $drops.set([...$drops.get(), newDrop]);
      console.log(`🎁 Forced type drop: ${forcedType} in room ${roomId}`);
      return;
    }

    const dropResult = rollDrop();

    if (!dropResult) return;

    if (dropResult.type === 'enemy_spawn') {
      if ((window as any).__spawnEnemiesAt) {
        (window as any).__spawnEnemiesAt(position, dropResult.spawnCount || 1);
      }
    } else {
      const newDrop: Drop = {
        id: Date.now() + Math.random(),
        type: dropResult.type,
        position,
        roomId,
      };
      if (dropResult.type === 'chest') {
        (newDrop as any).variety = dropResult.chestVariety || 1;
        (newDrop as any).chestType = dropResult.chestType || 'gray';
      }
      if (dropResult.type === 'coin') (newDrop as any).value = dropResult.value || 1;
      $drops.set([...$drops.get(), newDrop]);
      console.log(`🎁 Enemy drop spawned: ${newDrop.type} in room ${roomId}`);
    }
  }, [dropEvents]);

  // Handle room clear loot
  useEffect(() => {
    if (!roomClearEvents) return;

    const { position, roomId, roomType } = roomClearEvents;
    console.log(`🎁 DropManager: Handling room clear loot for ${roomType} at ${position} in room ${roomId}`);
    const dropResult = rollRoomClearLoot(roomType);

    if (!dropResult) return;

    const newDrop: Drop = {
      id: Date.now() + Math.random(),
      type: dropResult.type,
      position,
      roomId,
    };
    if (dropResult.type === 'chest') {
      (newDrop as any).variety = dropResult.chestVariety || 1;
      (newDrop as any).chestType = dropResult.chestType || 'gray';
    }
    if (dropResult.type === 'coin') (newDrop as any).value = dropResult.value || 1;
    if (dropResult.type === 'item') (newDrop as any).itemId = dropResult.itemId;

    console.log(`🎁 Room clear loot spawned: ${newDrop.type} in room ${roomId}`, newDrop);
    $drops.set([...$drops.get(), newDrop]);
  }, [roomClearEvents]);

  const handleCollectKey = (id: number) => {
    $drops.set($drops.get().filter((d) => d.id !== id));
    addItem('key');
    console.log('🔑 Key collected!');
  };

  const handleCollectBomb = (id: number) => {
    $drops.set($drops.get().filter((d) => d.id !== id));
    addItem('bomb');
    console.log('💣 Bomb collected!');
  };

  const handleCollectChest = (id: number, variety: number, chestType: string, position: [number, number, number]) => {
    $drops.set($drops.get().filter((d) => d.id !== id));
    console.log(`💎 ${chestType.toUpperCase()} Chest opened with ${variety} items!`);
    $coins.set($coins.get() + variety * 5); // Bonus coins for opening

    const lootResults = chestType === 'gold'
      ? rollGoldChestLoot(variety)
      : rollGrayChestLoot(variety);

    console.log(`🎲 Loot Rolled (${chestType}, var=${variety}):`, lootResults);

    const newDrops: Drop[] = [];

    lootResults.forEach((result, i) => {
      const offsetX = (Math.random() - 0.5) * 5.0;
      const offsetZ = (Math.random() - 0.5) * 5.0;

      const newDrop: Drop = {
        id: Date.now() + Math.random() + i,
        type: result.type,
        position: [position[0] + offsetX, position[1] + 0.5, position[2] + offsetZ],
        roomId: currentRoomId
      };

      if (result.type === 'item') (newDrop as any).itemId = result.itemId;
      if (result.type === 'coin') (newDrop as any).value = result.value;
      if (result.type === 'chest') { // Rare recursion?
        (newDrop as any).variety = result.chestVariety;
        (newDrop as any).chestType = result.chestType;
      }

      newDrops.push(newDrop);
    });

    if (newDrops.length > 0) {
      $drops.set([...$drops.get(), ...newDrops]);
      console.log(`🎁 Chest spawned ${newDrops.length} drops`);
    }
  };

  const handleCollectCoin = (id: number, value: number = 1) => {
    $drops.set($drops.get().filter((d) => d.id !== id));
    $coins.set($coins.get() + value);
    console.log(`🪙 Collected coin ($${value})! Total: ${$coins.get()}`);
  };

  const handleCollectItem = (id: number, itemId: string) => {
    $drops.set($drops.get().filter((d) => d.id !== id));
    addItem(itemId);
    console.log(`✨ Collected item: ${itemId}`);
  };

  // Only render drops for the current room
  const roomDrops = drops.filter(d => d.roomId === currentRoomId);

  return (
    <>
      {roomDrops.map((drop) => {
        if (drop.type === 'key') {
          return (
            <Key
              key={drop.id}
              position={drop.position}
              onCollect={() => handleCollectKey(drop.id)}
            />
          );
        } else if (drop.type === 'bomb') {
          return (
            <Bomb
              key={drop.id}
              position={drop.position}
              onCollect={() => handleCollectBomb(drop.id)}
            />
          );
        } else if (drop.type === 'chest') {
          return (
            <Chest
              key={drop.id}
              position={drop.position}
              variety={(drop as any).variety || 1}
              type={(drop as any).chestType || 'gray'}
              onCollect={() => handleCollectChest(drop.id, (drop as any).variety || 1, (drop as any).chestType || 'gray', drop.position)}
            />
          );
        } else if (drop.type === 'coin') {
          return (
            <Coin
              key={drop.id}
              position={drop.position}
              value={drop.value}
              onCollect={() => handleCollectCoin(drop.id, drop.value)}
            />
          );
        } else if (drop.type === 'item') {
          return (
            <Item
              key={drop.id}
              position={drop.position}
              itemId={(drop as any).itemId || 'unknown'}
              onCollect={() => handleCollectItem(drop.id, (drop as any).itemId || 'unknown')}
            />
          );
        } else if (drop.type === 'health') {
          return (
            <HealthPickup
              key={drop.id}
              position={drop.position}
              onCollect={() => {
                $drops.set($drops.get().filter((d) => d.id !== drop.id));
                console.log('♥ Health collected!');
              }}
            />
          );
        } else if (drop.type === 'shield') {
          return (
            <ShieldPickup
              key={drop.id}
              position={drop.position}
              onCollect={() => {
                $drops.set($drops.get().filter((d) => d.id !== drop.id));
                console.log('🛡️ Shield collected!');
              }}
            />
          );
        }
        return null;
      })}
    </>
  );
}
