import { atom } from 'nanostores';
import type { ProjectileData } from '../types/game';

export interface ProjectileState {
  id: number;
  data: ProjectileData;
  origin: [number, number, number];
}

// Player health
export const $health = atom<number>(100);
export const $maxHealth = atom<number>(100);

// Player position (for tracking, physics handles actual position)
export const $position = atom<[number, number, number]>([0, 0.5, 0]);
// Player velocity (for momentum effects)
export const $velocity = atom<[number, number, number]>([0, 0, 0]);

// Player invulnerability flag (for spawn protection)
export const $isInvulnerable = atom<boolean>(false);

// Teleport signal (position to teleport to)
export const $teleportTo = atom<[number, number, number] | null>(null);
export const $isTeleporting = atom<boolean>(false);

// Projectiles state
export const $projectiles = atom<ProjectileState[]>([]);

// Actions
export const setHealth = (value: number) => {
  $health.set(Math.max(0, Math.min(value, $maxHealth.get())));
};

export const setMaxHealth = (value: number) => {
  $maxHealth.set(value);
  const current = $health.get();
  if (current > value) {
    $health.set(value);
  }
};

export const takeDamage = (amount: number) => {
  if ($isInvulnerable.get()) {
    console.log('🛡️ Damage blocked by invulnerability:', amount);
    return;
  }
  console.error('⚠️ TAKING DAMAGE:', amount, 'HP remaining:', $health.get() - amount);
  setHealth($health.get() - amount);
};

export const heal = (amount: number) => {
  setHealth($health.get() + amount);
};

export const addProjectiles = (newProjectiles: ProjectileState[]) => {
  $projectiles.set([...$projectiles.get(), ...newProjectiles]);
};

export const removeProjectile = (id: number) => {
  $projectiles.set($projectiles.get().filter(p => p.id !== id));
};

