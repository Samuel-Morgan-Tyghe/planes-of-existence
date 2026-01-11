import { expect, test } from '@playwright/test';

test.describe('Arena Mode', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Arena Mode
        await page.goto('http://localhost:3005/?mode=arena');
        // Wait for canvas
        await page.waitForSelector('canvas');
        // Wait for Sandbox Controls to be visible
        await page.waitForSelector('button:has-text("Clear All")');
    });

    test('should load arena and spawn enemy', async ({ page }) => {
        // Click "Glitch" spawn button
        await page.click('button:has-text("Glitch")');

        // Check internal state via window.gameState or just ensure no crash
        // Since ArenaMode might not expose gameState directly in the same way, we check visual or canvas
        // Wait a bit
        await page.waitForTimeout(1000);
        
        // Take screenshot to verify valid render
        await expect(page).toHaveScreenshot('arena-spawn.png', {
            maxDiffPixels: 500
        });
    });
});
