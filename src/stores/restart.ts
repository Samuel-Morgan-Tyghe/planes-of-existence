import { atom } from 'nanostores';
import { $clearedRooms, $currentFloor, $currentRoomId, $inventory, $isPaused, $stats, $visitedRooms, switchPlane } from './game';
import { $bossDefeated, $enemiesRemaining } from './gameState';
import { $maxHealth, $position, setHealth } from './player';

// Trigger for forcing scene regeneration
export const $restartTrigger = atom<number>(0);

/**
 * Restart the current run - resets all run-specific state
 * but preserves meta-progression (pixels, fragments, unlocks, upgrades)
 */
export function restartRun() {
  // Reset player health
  setHealth($maxHealth.get());
  
  // Reset player position to spawn point
  $position.set([0, 0.5, 0]);
  
  
  // Reset plane to default
  switchPlane('ISO');
  
  // Reset stats to defaults
  $stats.set({
    sharpness: 0.5,
    saturation: 1.0,
    contrast: 0.5,
    brightness: 1.0,
    resolution: 1.0,
    range: 2.0,
    fireRate: 5.0,
    projectileSize: 1.0,
    damage: 1.0,
    projectileSpeed: 10.0,
    critChance: 0.05,
    armorPen: 0,
    pierce: 0,
    trueDamage: false,
    dodgeChance: 0,
    stealthMultiplier: 1.0,
    lootRarityBonus: 0,
    incomingDamageMultiplier: 1.0,
  });
  
  // Clear inventory
  $inventory.set({});
  
  // Reset room/floor
  $currentRoomId.set(0);
  $currentFloor.set(0);
  $visitedRooms.set(new Set([0])); // Reset visited rooms, start room is visited
  $clearedRooms.set(new Set()); // Reset cleared rooms
  $enemiesRemaining.set(0);
  $bossDefeated.set(false);
  
  // Unpause if paused
  $isPaused.set(false);
  
  // Trigger scene regeneration by incrementing restart trigger
  // Components that depend on this will regenerate (level, enemies, loot)
  $restartTrigger.set($restartTrigger.get() + 1);
  
  // Note: Meta-progression (pixels, fragments, unlocks, upgrades) is preserved
  // via localStorage persistence in stores/meta.ts
}

