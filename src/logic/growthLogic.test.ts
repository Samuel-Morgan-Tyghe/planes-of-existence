import { describe, expect, it } from 'vitest';
import { calculateGrowthStats } from './growthLogic';

describe('Growth Logic', () => {
    it('should return base stats when time alive is 0', () => {
        // Base speed 5 is below max cap of 8
        const stats = calculateGrowthStats('growth_basic', 0, 1, 5, 10);
        // Multiplier should be 1
        expect(stats.scale).toBeCloseTo(1.0);
        expect(stats.speed).toBeCloseTo(5);
        expect(stats.damage).toBeCloseTo(10);
        expect(stats.healthMultiplier).toBeCloseTo(1.0);
    });

    it('should increase scale and damage over time', () => {
        const stats = calculateGrowthStats('growth_basic', 10, 1, 10, 10);
        // rt = 10 * 0.12 = 1.2
        // mult = 1 + 1.2 + 1.44 = 3.64
        expect(stats.scale).toBeGreaterThan(1.0);
        expect(stats.damage).toBeGreaterThan(10);
    });

    it('should respect max caps', () => {
        // Very long time
        const stats = calculateGrowthStats('growth_basic', 1000, 1, 10, 10);
        
        // Default caps: Scale 4.0, Speed 8.0 (Wait, base was 10, so it might clamp down? Logic says min(calc, max))
        // Actually code: currentSpeed = Math.min(baseSpeed * speedMultiplier, maxSpeed)
        // If base is 10 and max is 8, it should be 8.
        expect(stats.speed).toBeLessThan(9); 
        expect(stats.scale).toBeLessThanOrEqual(4.0);
        expect(stats.damage).toBeLessThanOrEqual(100);
    });

    it('should apply variant modifies', () => {
        const statsHealth = calculateGrowthStats('growth_health', 100, 1, 10, 10);
        const statsHarden = calculateGrowthStats('growth_harden', 100, 1, 10, 10);

        // Health variant has much higher health cap
        expect(statsHealth.healthMultiplier).toBeGreaterThan(statsHarden.healthMultiplier || 0);
    });
});
