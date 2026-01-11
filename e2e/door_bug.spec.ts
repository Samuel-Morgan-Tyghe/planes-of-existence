import { expect, test } from '@playwright/test';

test.describe('Door Interaction Regression', () => {
    test.beforeEach(async ({ page }) => {
        // Load main game
        await page.goto('http://localhost:3005/?test=true'); 
        await page.waitForSelector('canvas');
        await page.waitForTimeout(1000);
    });

    test('Shooting a door should NOT trigger it', async ({ page }) => {
        let triggered = false;
        page.on('console', msg => {
            if (msg.text().includes('triggered by Player') || msg.text().includes('Door north activated')) {
               triggered = true;
            }
        });

        // Start Room usually has a North Door at Z = -10 (approx)
        // Aim North (Up screen) and shoot
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        if(!box) return;
        
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2 - 150);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.up();
        
        await page.waitForTimeout(1000);
        
        // Assert
        expect(triggered).toBe(false);
    });
});
