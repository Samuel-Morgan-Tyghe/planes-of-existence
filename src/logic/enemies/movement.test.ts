import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { calculateEnemyVelocity } from './movement';

describe('Movement Logic', () => {
  it('should return zero vector for stationary turret', () => {
    // Mock EnemyState with definition.id = 'turret'
    const enemy: any = {
      definition: { id: 'turret', speed: 0, attackType: 'ranged' }, 
      id: 1,
      heldItem: null
    };
    
    const playerPos = new Vector3(0, 0, 0);
    const enemyVec = new Vector3(10, 0, 0);
    
    // speed 0
    const velocity = calculateEnemyVelocity(enemy, playerPos, enemyVec, 10);
    
    expect(velocity.length()).toBe(0);
  });

  it('should chase player if standard melee enemy', () => {
    // Mock standard enemy (not one of the special cases in the switch)
    // E.g. 'basic_chaser'
    const enemy: any = {
      definition: { id: 'basic_chaser', speed: 5, attackType: 'melee', attackRange: 2 },
      id: 2,
      heldItem: null
    };

    const playerPos = new Vector3(0, 0, 0);
    const enemyVec = new Vector3(10, 0, 0); // To the right of player
    
    // Distance 10 (outside attack range 2)
    const velocity = calculateEnemyVelocity(enemy, playerPos, enemyVec, 10);
    
    // Should move towards player (left) => x should be negative
    expect(velocity.x).toBeLessThan(0);
    expect(velocity.z).toBe(0);
    
    // Magnitude should be speed (5)
    expect(velocity.length()).toBeCloseTo(5);
  });
  
  it('should stop when in attack range (melee)', () => {
    const enemy: any = {
      definition: { id: 'basic_chaser', speed: 5, attackType: 'melee', attackRange: 2 },
      id: 3,
      heldItem: null
    };

    const playerPos = new Vector3(0, 0, 0);
    const enemyVec = new Vector3(1.5, 0, 0); // Inside range 2
    
    const velocity = calculateEnemyVelocity(enemy, playerPos, enemyVec, 1.5);
    
    expect(velocity.length()).toBe(0);
  });
});
