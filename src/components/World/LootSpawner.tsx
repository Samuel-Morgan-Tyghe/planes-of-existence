import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { generateLevel, gridToWorld } from '../../utils/levelGen';
import { Loot } from './Loot';
import { ITEM_DEFINITIONS } from '../../types/items';
import { $restartTrigger } from '../../stores/restart';

interface LootItem {
  id: number;
  position: [number, number, number];
  type: 'item' | 'pixel' | 'upgrade';
  itemId?: string;
  value?: number;
}

export function LootSpawner() {
  const [lootItems, setLootItems] = useState<LootItem[]>([]);
  const restartTrigger = useStore($restartTrigger);

  useEffect(() => {
    // Regenerate when restart trigger changes
    const level = generateLevel();
    const newLoot: LootItem[] = [];
    let lootIdCounter = 0;

    level.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === 3) {
          // Loot spawn point
          const [worldX, worldY, worldZ] = gridToWorld(x, y);
          
          // Random loot type
          const lootType = Math.random();
          if (lootType < 0.4) {
            // Item
            const itemIds = Object.keys(ITEM_DEFINITIONS);
            const randomItemId = itemIds[Math.floor(Math.random() * itemIds.length)];
            newLoot.push({
              id: lootIdCounter++,
              position: [worldX, worldY + 0.5, worldZ],
              type: 'item',
              itemId: randomItemId,
            });
          } else if (lootType < 0.8) {
            // Pixels (currency)
            newLoot.push({
              id: lootIdCounter++,
              position: [worldX, worldY + 0.5, worldZ],
              type: 'pixel',
              value: Math.floor(Math.random() * 50) + 10,
            });
          } else {
            // Upgrade orb
            newLoot.push({
              id: lootIdCounter++,
              position: [worldX, worldY + 0.5, worldZ],
              type: 'upgrade',
              value: 1,
            });
          }
        }
      });
    });

    setLootItems(newLoot);
  }, [restartTrigger]);

  const handleCollect = (lootId: number) => {
    setLootItems((prev) => prev.filter((l) => l.id !== lootId));
  };

  return (
    <>
      {lootItems.map((loot) => (
        <Loot
          key={loot.id}
          position={loot.position}
          type={loot.type}
          itemId={loot.itemId}
          value={loot.value}
          onCollect={() => handleCollect(loot.id)}
        />
      ))}
    </>
  );
}

