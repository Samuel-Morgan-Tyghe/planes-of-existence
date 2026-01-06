import { Vector3 } from 'three';

export function getHopperVelocity(
  baseDirection: Vector3,
  distance: number,
  detectionRange: number,
  moveSpeed: number
): Vector3 {
  const now = Date.now();
  const jumpDuration = 800;
  const recoverDuration = 1400; // Total 2200ms
  const cycleTime = jumpDuration + recoverDuration;
  const offset = now % cycleTime;
  
  // Determine movement direction
  let moveDir = baseDirection.clone();
  
  if (distance > detectionRange) {
     const angle = now / 1000;
     // Circular tangent
     moveDir.set(-Math.sin(angle), 0, Math.cos(angle)).normalize(); 
  }

  // Jump Phase
  if (offset < jumpDuration) {
     const progress = offset / jumpDuration; // 0.0 to 1.0
     
     // Increased Vertical Impulse: 
     // Range +24 to -24 => Peak Height ~7.2u (Massive jump)
     const vy = (0.5 - progress) * 48; 
     
     // Boost horizontal speed during jump for better distance
     const horizontalBoost = 1.5;
     
     return moveDir.multiplyScalar(moveSpeed * horizontalBoost).setY(vy);
  } else {
     // Land/Recover Phase
     return new Vector3(0, -10, 0);
  }
}
