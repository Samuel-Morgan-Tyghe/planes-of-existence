import { expect, test } from '@playwright/test';

test.describe('Shop System Scenario', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true&seed=shop_test');
        await page.waitForSelector('canvas');
        await page.waitForFunction(() => (window as any).gameState !== undefined);
    });

    test('should allow buying an item with sufficient coins', async ({ page }) => {
        // 1. Give player coins
        await page.evaluate(() => {
            (window as any).gameState.addCoins(100);
        });

        // 2. Buy Item (Cost 50)
        const success = await page.evaluate(() => {
            return (window as any).gameState.buyItem('health_potion', 50);
        });
        expect(success).toBe(true);
        
        // 3. Verify State
        const coins = await page.evaluate(() => (window as any).gameState.coins);
        const inventory = await page.evaluate(() => (window as any).gameState.inventory);
        
        expect(coins).toBe(50); // 100 - 50
        expect(inventory['health_potion']).toBeGreaterThan(0);
    });

    test('should prevent buying item with insufficient coins', async ({ page }) => {
        // 1. Set coins to low amount
        await page.evaluate(() => {
            (window as any).gameState.setCoins(10); 
        });

        // 2. Try to Buy Item (Cost 50)
        const success = await page.evaluate(() => {
            return (window as any).gameState.buyItem('health_potion', 50);
        });
        expect(success).toBe(false);

        // 3. Verify State Unchanged
        const coins = await page.evaluate(() => (window as any).gameState.coins);
        const inventory = await page.evaluate(() => (window as any).gameState.inventory);
        
        expect(coins).toBe(10);
        expect(inventory['health_potion'] || 0).toBe(0);
    });
});
