import { expect, test } from '@playwright/test';

// Skipped due to WebGL Context Lost (Crash) in Headless environment when spawning RigidBodies.
test.describe('Test Chamber Scenario', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    await page.goto('/?test=true&seed=123&scenario=test_chamber');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test('should generate a single room', async ({ page }) => {
    const roomId = await page.evaluate(() => (window as any).gameState.roomId);
    expect(roomId).toBe(0);
    
    // Check floor data via some exposed hook or inferred from enemies
    // In test_chamber, type is 'normal', so 1 enemy.
    
    // Wait for enemy to spawn
    await page.waitForFunction(() => (window as any).gameState.enemies.length > 0, null, { timeout: 5000 });
    
    const enemyCount = await page.evaluate(() => (window as any).gameState.enemies.length);
    expect(enemyCount).toBe(1);
    
    console.log('Test Chamber: Enemy Count verified as 1');
  });
});
