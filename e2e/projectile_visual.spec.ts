import { expect, test } from '@playwright/test';

test.describe('Projectile Visuals', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3005/?test=true');
        await page.waitForSelector('canvas');
        // Wait for game state
        await page.waitForFunction(() => (window as any).gameState?.ready);
    });

    test('should fire projectile with ribbon trail', async ({ page }) => {
        // Attack
        await page.keyboard.press('Enter');
        
        // Wait a few frames for visual
        await page.waitForTimeout(500);
        
        // Ensure no crash logic (canvas still exists)
        const canvas = await page.$('canvas');
        expect(canvas).toBeTruthy();

        // Optional: Snapshot
        await expect(page).toHaveScreenshot('projectile-ribbon.png', {
            maxDiffPixels: 2000 // Allow some variance
        });
    });
});
