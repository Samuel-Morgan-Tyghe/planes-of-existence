import { action, map } from 'nanostores';

export const $brokenRocks = map<Record<string, boolean>>({});

export const breakRock = action($brokenRocks, 'breakRock', (store, id: string) => {
  store.setKey(id, true);
});

export const resetRocks = action($brokenRocks, 'resetRocks', (store) => {
  store.set({});
});
