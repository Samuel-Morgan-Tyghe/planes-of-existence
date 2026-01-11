import { describe, expect, it, vi } from 'vitest';
import { rollDestructibleLoot, rollGoldChestLoot, rollGrayChestLoot } from './loot';



// Mock the Nanostore dependency
vi.mock('../stores/game', () => ({
  $inventory: {
    get: vi.fn(() => ({})), // Empty inventory by default
  }
}));

// Mock ITEMS definitions implicitly by letting it use the real ones or mocking if needed.
// loot.ts imports ITEM_DEFINITIONS. We can let it use real ones, but if we wanted isolation we'd mock it.
// For now real ones are fine as they are constant data.

describe('Loot Logic', () => {
  describe('rollGoldChestLoot', () => {
    it('should return correct number of items', () => {
      const variety = 3;
      const loot = rollGoldChestLoot(variety);
      expect(loot.length).toBe(variety);
    });

    it('should return only valid loot types (item, shield, coin, key, bomb)', () => {
      const loot = rollGoldChestLoot(100); // Roll many
      const validTypes = ['item', 'shield', 'coin', 'key', 'bomb'];
      loot.forEach(item => {
        expect(validTypes).toContain(item.type);
        if (item.type === 'coin') {
          expect(item.value).toBeGreaterThan(0);
        }
      });
    });

    it('should eventually drop powerup items', () => {
      // Statistical test: ensure items appear ~35%
      let items = 0;
      const runs = 1000;
      const results = rollGoldChestLoot(runs);
      
      results.forEach(r => {
        if (r.type === 'item') items++;
      });
      
      // Allow variance: 30-40%
      expect(items).toBeGreaterThan(250);
      expect(items).toBeLessThan(450);
    });
  });

  describe('rollGrayChestLoot', () => {
    it('should not return powerup items (only consumables)', () => {
       const runs = 100;
       const results = rollGrayChestLoot(runs);
       
       results.forEach(r => {
         expect(r.type).not.toBe('item');
       });
    });
  });
  describe('rollDestructibleLoot', () => {
    it('should drop correct loot types for crate', () => {
        // Force drop chance to hit (random < 0.05)
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);
        
        const loot = rollDestructibleLoot('crate');
        
        expect(loot).toBeDefined();
        if (loot) {
             const validTypes = ['item', 'bomb', 'coin'];
             expect(validTypes).toContain(loot.type);
        }
        
        randomSpy.mockRestore();
    });
  });
});
