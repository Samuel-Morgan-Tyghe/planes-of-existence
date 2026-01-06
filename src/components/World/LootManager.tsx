import { useStore } from '@nanostores/react';
import { $activeLoot } from '../../stores/loot';
import { Loot } from './Loot';

export function LootManager() {
  const activeLoot = useStore($activeLoot);

  return (
    <>
      {Object.values(activeLoot).map((item) => (
        <Loot key={item.id} item={item} />
      ))}
    </>
  );
}
