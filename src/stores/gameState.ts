import { atom } from 'nanostores';

// Current floor/level
export const $currentFloor = atom<number>(1);

// Enemies remaining in current floor
export const $enemiesRemaining = atom<number>(0);

// Boss defeated flag
export const $bossDefeated = atom<boolean>(false);

// Actions
export const nextFloor = () => {
  $currentFloor.set($currentFloor.get() + 1);
  $bossDefeated.set(false);
};

export const setEnemiesRemaining = (count: number) => {
  $enemiesRemaining.set(count);
};

export const enemyKilled = () => {
  $enemiesRemaining.set(Math.max(0, $enemiesRemaining.get() - 1));
};

export const bossDefeated = () => {
  $bossDefeated.set(true);
};

