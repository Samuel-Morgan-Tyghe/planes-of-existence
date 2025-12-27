import { atom, map } from 'nanostores';

// Helper to persist atoms to localStorage
function persistentAtom<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key);
  const initial = stored ? JSON.parse(stored) : defaultValue;
  const store = atom<T>(initial);
  
  // Subscribe to changes and persist
  store.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  
  return store;
}

// Helper to persist maps to localStorage
function persistentMap<T extends Record<string, any>>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key);
  const initial = stored ? JSON.parse(stored) : defaultValue;
  const store = map<T>(initial);
  
  // Subscribe to changes and persist
  store.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  
  return store;
}

// Currency (persisted to localStorage)
export const $pixels = persistentAtom<number>('render_game_pixels', 0);
export const $fragments = persistentAtom<number>('render_game_fragments', 0);

// Unlocks (featureId -> unlocked) (persisted to localStorage)
export const $unlocks = persistentMap<Record<string, boolean>>('render_game_unlocks', {});

// Upgrades (upgradeId -> level) (persisted to localStorage)
export const $upgrades = persistentMap<Record<string, number>>('render_game_upgrades', {});

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

