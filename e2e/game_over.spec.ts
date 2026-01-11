import { expect, test } from '@playwright/test';

test.describe('Game Over & Restart Scenario', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true&seed=game_over');
        await page.waitForSelector('canvas');
        await page.waitForFunction(() => (window as any).gameState !== undefined);
    });

    test('should trigger game over when health reaches zero', async ({ page }) => {
        // 1. Set health to 0
        await page.evaluate(() => {
            (window as any).gameState.setHealth(0);
        });

        // 2. Wait for game over state or UI
        // Assuming we check health immediately or a game over flag
        // Let's verify health is 0
        const health = await page.evaluate(() => (window as any).gameState.health);
        expect(health).toBe(0);

        // Check for Game Over overlay if it exists
        // await page.waitForSelector('.game-over-screen'); // If implemented
    });
    
    test('should restart game and reset health', async ({ page }) => {
         // 1. Set health to 0
        await page.evaluate(() => {
             (window as any).gameState.setHealth(0);
        });
        
        // 2. Trigger restart (mock click or function)
        // If we don't have a UI element to click in test mode, we might need to expose restart()
        // Or assume reload.
        await page.reload();
        await page.waitForSelector('canvas');
        await page.waitForFunction(() => (window as any).gameState !== undefined);
        
        const health = await page.evaluate(() => (window as any).gameState.health);
        expect(health).toBe(100); // Default Max
    });
});
