import { atom, map } from 'nanostores';

// Currency
export const $pixels = atom<number>(0);
export const $fragments = atom<number>(0);

// Unlocks (featureId -> unlocked)
export const $unlocks = map<Record<string, boolean>>({});

// Upgrades (upgradeId -> level)
export const $upgrades = map<Record<string, number>>({});

// Actions
export const addPixels = (amount: number) => {
  $pixels.set($pixels.get() + amount);
};

export const spendPixels = (amount: number) => {
  const current = $pixels.get();
  if (current >= amount) {
    $pixels.set(current - amount);
    return true;
  }
  return false;
};

export const addFragments = (amount: number) => {
  $fragments.set($fragments.get() + amount);
};

export const unlockFeature = (featureId: string) => {
  $unlocks.setKey(featureId, true);
};

export const upgradeFeature = (upgradeId: string) => {
  const current = $upgrades.get()[upgradeId] || 0;
  $upgrades.setKey(upgradeId, current + 1);
};

