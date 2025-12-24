import { atom } from 'nanostores';

// Player health
export const $health = atom<number>(100);
export const $maxHealth = atom<number>(100);

// Player position (for tracking, physics handles actual position)
export const $position = atom<[number, number, number]>([0, 0, 0]);

// Actions
export const setHealth = (value: number) => {
  $health.set(Math.max(0, Math.min(value, $maxHealth.get())));
};

export const setMaxHealth = (value: number) => {
  $maxHealth.set(value);
  // Adjust current health if needed
  const current = $health.get();
  if (current > value) {
    $health.set(value);
  }
};

export const takeDamage = (amount: number) => {
  setHealth($health.get() - amount);
};

export const heal = (amount: number) => {
  setHealth($health.get() + amount);
};

