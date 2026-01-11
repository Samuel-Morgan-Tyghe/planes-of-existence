import { expect, test } from '@playwright/test';

test.describe('Hitbox 2.5D Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Spawn Turret in Arena Mode (at Z=-5)
    await page.goto('http://localhost:3005/?mode=arena&test=true&spawn=turret');
    await page.waitForSelector('canvas');
    // Wait for game/entities to load
    await page.waitForTimeout(2000);
  });

  test('Projectiles should hit Turret correctly', async ({ page }) => {
    // Setup listener for validation
    let hitRegistered = false;
    page.on('console', msg => {
        const text = msg.text();
        // Check for specific debug logs we saw in Enemy.tsx
        if (text.includes('reacting to hit') || text.includes('damage') || text.includes('Enemy')) {
             console.log('Game Log:', text);
             if (text.includes('hit') || text.includes('damage')) hitRegistered = true;
        }
    });

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Turret is at (0, 0, -5). Camera looks from +Z towards -Z.
    // -5 is "Up" on the screen relative to center (0,0).
    // Aim upwards.
    await page.mouse.move(centerX, centerY - 150); 
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.up();
    
    // Wait for travel and impact
    await page.waitForTimeout(1500);
    
    // Assert
    expect(hitRegistered).toBe(true);
  });
});
