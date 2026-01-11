import { expect, test } from '@playwright/test';

test.describe('Visual Regression', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Arena mode in test mode (hides UI)
        await page.goto('http://localhost:3005/?mode=arena&test=true');
        
        // Wait for canvas
        await page.waitForSelector('canvas');
        await page.waitForTimeout(1000); // Allow engine to settle
    });

    test('should render slime trails', async ({ page }) => {
        // Wait for sandbox API to be available
        await page.waitForFunction(() => (window as any).sandbox !== undefined);

        // Spawn a Toxic Slime via console
        await page.evaluate(() => {
            (window as any).sandbox.spawn('enemy', 'slime_toxic', [0, 0, 0]);
        });

        // Wait for trail to spawn (useEffect triggers on mount)
        await page.waitForTimeout(500);

        // Snapshot
        await expect(page).toHaveScreenshot('slime-trail.png', {
             maxDiffPixels: 200,
        });
    });
});
