import { expect, test } from '@playwright/test';

// Inventory & Items E2E Test
test.describe('Inventory & Items Scenario', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode and seed
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    await page.goto('/?test=true&seed=999');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test('should verify initial bomb count', async ({ page }) => {
    // Check initial inventory (default is 5 bombs in `game.ts`)
    const bombs = await page.evaluate(() => (window as any).gameState.inventory['bomb']);
    expect(bombs).toBe(5);
  });

  test('should pick up an item (mocked)', async ({ page }) => {
    // Use exposed QABot or game store methods to add an item
    await page.evaluate(() => {
        (window as any).gameState.addItem('key');
    });

    const keys = await page.evaluate(() => (window as any).gameState.inventory['key']);
    expect(keys).toBe(1);
  });

  test('should use a bomb and decrease inventory', async ({ page }) => {
    const initialBombs = await page.evaluate(() => (window as any).gameState.inventory['bomb']);
    expect(initialBombs).toBeGreaterThan(0);

    // Use bomb programmically to avoid input flakes
    await page.evaluate(() => {
        (window as any).gameState.useBomb([0,0,0], [0,0,1]);
    });

    // Wait a tick for state update
    await page.waitForTimeout(100);

    const newBombs = await page.evaluate(() => (window as any).gameState.inventory['bomb']);
    expect(newBombs).toBe(initialBombs - 1);
  });

  test('should not consume item if inventory is empty', async ({ page }) => {
    // 1. Ensure 0 keys
    await page.evaluate(() => {
         // Assuming we can manually set inventory or simulate logic
         // Since we don't have setInventory, let's just check a non-existent item 'magic_wand' or mock 'bomb' to 0
         // We can manipulate the store directly if we exposed access to store SETTERS or just set the map key
         // But we only exposed logic helpers.
         // Let's rely on an item we know we have 0 of (e.g. 'titan_plating' at start)
         (window as any).gameState.inventory['titan_plating'] = 0; // Force (though local object copy won't affect store?)
         // Wait, (window as any).gameState.inventory is the VALUE from useStore. Modifying it does nothing back to store.
         // We need to use `useBomb` when bomb count is 0.
         // Let's drain bombs or pick an empty item. `consumeItem` function isn't exposed directly, `useBomb` is.
         // `useBomb` checks 'bomb' key.
         
         // Helper to set bombs to 0? We don't have it.
         // We can just use `useBomb` 5 times then check 6th.
         for(let i=0; i<10; i++) {
            (window as any).gameState.useBomb([0,0,0], [0,0,0]); // Drain
         }
    });

    const bombs = await page.evaluate(() => (window as any).gameState.inventory['bomb'] || 0);
    expect(bombs).toBe(0);

    // Try one more time
    const success = await page.evaluate(() => (window as any).gameState.useBomb([0,0,0], [0,0,0]));
    expect(success).toBe(false);
  });
});
