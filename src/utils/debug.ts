/**
 * Debug utilities for game development
 */

const DEBUG_ENABLED = typeof window !== 'undefined' && 
  (localStorage.getItem('debug') === 'true' || 
   import.meta.env.DEV);

export const debugLog = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.log('[RENDER]', ...args);
  }
};

export const debugError = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.error('[RENDER ERROR]', ...args);
  }
};

export const debugWarn = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.warn('[RENDER WARN]', ...args);
  }
};

/**
 * Track game state for debugging
 */
export const debugState = {
  playerPosition: [0, 0, 0] as [number, number, number],
  enemyCount: 0,
  projectileCount: 0,
  lastError: null as Error | null,
};

export const updateDebugState = (updates: Partial<typeof debugState>) => {
  Object.assign(debugState, updates);
  if (DEBUG_ENABLED) {
    debugLog('State update:', updates);
  }
};

