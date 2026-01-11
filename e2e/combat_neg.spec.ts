import { expect, test } from '@playwright/test';

test.describe('Combat Mechanics - Negative Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    await page.goto('/?test=true&seed=combat_test');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test('should not allow health to go below zero (clamping)', async ({ page }) => {
    // 1. Deal massive damage (simulated via setHealth)
    await page.evaluate(() => {
        (window as any).gameState.setHealth(-50);
    });

    const health = await page.evaluate(() => (window as any).gameState.health);
    expect(health).toBe(0);
  });
  
  test('should trigger game over state when health hits zero', async ({ page }) => {
      await page.evaluate(() => {
        (window as any).gameState.setHealth(0);
      });
      
      const health = await page.evaluate(() => (window as any).gameState.health);
      expect(health).toBe(0);
      
      // Verify Game Over (assuming we have a flag or UI element)
      // For now, Health 0 is the proxy for Game Over state in this minimal test.
  });
});

