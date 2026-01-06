import { Vector3 } from 'three';

export function getKnightVelocity(
  baseDirection: Vector3,
  distance: number,
  detectionRange: number,
  moveSpeed: number,
  offsetId: number // Use entity ID to randomize/stabilize 'left/right' choice
): Vector3 {
  const now = Date.now();
  const jumpDuration = 800; // Same as Hopper for consistency
  const recoverDuration = 1200; 
  const cycleTime = jumpDuration + recoverDuration;
  const offset = now % cycleTime;
  
  // Determine movement direction (L-Shape)
  let moveDir = baseDirection.clone();
  
  if (distance > detectionRange) {
     // Idle: Circle/Patrol "Around the room"
     // We can just use the standard circle logic but maybe more "steppy"?
     const angle = now / 1500;
     moveDir.set(-Math.sin(angle), 0, Math.cos(angle)).normalize(); 
  } else {
     // Chase: Apply Knight L-Move Bias
     // "Two steps forward, one step left/right"
     // Forward = baseDirection
     // Side = Orthogonal
     
     const right = new Vector3(baseDirection.z, 0, -baseDirection.x).normalize();
     
     // Decide Left vs Right based on time + ID to avoid everyone moving in sync
     // Cycle side every jump to zigzag
     const jumpCount = Math.floor(now / cycleTime);
     const goRight = (jumpCount + offsetId) % 2 === 0;
     
     const sideDir = goRight ? right : right.clone().negate();
     
     // Mix: 2 parts Forward, 1 part Side
     moveDir.multiplyScalar(2).add(sideDir).normalize();
  }

  // Jump Phase
  if (offset < jumpDuration) {
     const progress = offset / jumpDuration;
     
     // Heavy Jump (Knight is tankier)
     // Peak Height ~12u (Massive heavy arc)
     const vy = (0.5 - progress) * 64; 
     
     // Boost horizontal speed for the "Big Jump" feel
     const horizontalBoost = 2.0;

     return moveDir.multiplyScalar(moveSpeed * horizontalBoost).setY(vy);
  } else {
     // Land/Recover Phase
     return new Vector3(0, -10, 0);
  }
}
