import { atom } from 'nanostores';

export interface ProjectileState {
  id: number;
  origin: [number, number, number];
  direction: [number, number, number];
  type: 'normal' | 'soundwave';
  damage: number;
  speed: number;
  color: string;
}

export const $enemyProjectiles = atom<Record<number, ProjectileState>>({});

let nextId = 0;

export function addEnemyProjectile(projectile: Omit<ProjectileState, 'id'>) {
  const id = nextId++;
  const current = $enemyProjectiles.get();
  $enemyProjectiles.set({ ...current, [id]: { ...projectile, id } });
}

export function removeEnemyProjectile(id: number) {
  const current = $enemyProjectiles.get();
  const { [id]: _, ...rest } = current;
  $enemyProjectiles.set(rest);
}

export function clearEnemyProjectiles() {
  $enemyProjectiles.set({});
}
