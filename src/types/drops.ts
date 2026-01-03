export type DropType = 'key' | 'bomb' | 'chest' | 'enemy_spawn' | 'coin' | 'item' | 'health';

export interface Drop {
  id: number;
  type: DropType;
  position: [number, number, number];
  roomId: number;
}

export interface DropRollResult {
  type: DropType;
  spawnCount?: number; // For enemy spawns
  chestVariety?: number; // For chests (how many items)
  itemId?: string; // For items
}

/**
 * Roll for a drop from an enemy death
 */
export function rollDrop(): DropRollResult | null {
  const roll = Math.random();

  if (roll < 0.05) return { type: 'health' }; // 5% chance for Health
  if (roll < 0.15) return { type: 'coin' };
  if (roll < 0.20) return { type: 'key' };
  if (roll < 0.25) return { type: 'bomb' };
  if (roll < 0.27) return { type: 'chest', chestVariety: 1 };
  if (roll < 0.30) return { type: 'enemy_spawn', spawnCount: 1 };

  return null;
}

/**
 * Roll for room clear loot
 */
export function rollRoomClearLoot(roomType: string): DropRollResult | null {
  if (roomType === 'treasure') {
    const itemIds = [
      'fiber_optic_cable', 'router_extender', 'ping_timeout_override', 'sniper_exe',
      'turbo_button', 'v_sync_off', 'script_kiddy', 'ddos_attack',
      'big_data', 'bloatware', 'hitbox_dilation', 'zip_folder',
      'root_access', 'malware_injection', 'overclocked_gpu', 'critical_error',
      'ssd_upgrade', 'antenna_5g', 'lag_switch', 'mouse_acceleration',
      // Artistic Items
      'unsharp_mask', 'gaussian_blur', 'edge_detection', 'bokeh_filter',
      'digital_vibrance', 'deep_fried', 'noir_filter', 'color_invert', 'sepia_tone',
      'oled_black', 'washed_out', 'threshold', 'gamma_correction',
      'lens_flare', 'dark_mode', 'flashbang', 'night_sight',
      'texture_pack_4k', 'downsampler_8bit', 'dlss_performance', 'dead_pixel_artistic', 'polygon_decimator',
      // New Artistic Items (based on the instruction's context, assuming these were intended)
      'pixelation', 'vignette', 'bloom', 'noise', 'scanline'
    ];
    const randomId = itemIds[Math.floor(Math.random() * itemIds.length)];
    return { type: 'item', itemId: randomId };
  }

  const lootRoll = Math.random();
  if (lootRoll < 0.4) return { type: 'chest', chestVariety: Math.floor(Math.random() * 3) + 1 };
  if (lootRoll < 0.7) return { type: 'key' };
  return { type: 'bomb' };
}
