import type { RapierRigidBody } from '@react-three/rapier';
import { atom } from 'nanostores';

// Map of projectile IDs to their physics bodies for direct access
export const projectileBodies = new Map<number, RapierRigidBody>();

export interface ProjectileState {
  id: number;
  origin: [number, number, number];
  direction: [number, number, number];
  type: 'normal' | 'soundwave';
  damage: number;
  speed: number;
  color: string;
  size?: number;
  lifetime?: number;
  gravityScale?: number;
  maintainVelocity?: boolean;
  popable?: boolean;
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
