import { Vector3 } from 'three';

export function getNovaVelocity(
  speed: number,
  enemyId: number
): Vector3 {
  const time = Date.now() / 1000;
  
  // Use unique offsets per enemy ID
  const seed = enemyId * 13.37;
  
  // Change direction slowly over time
  const driftX = Math.sin(time * 0.5 + seed);
  const driftZ = Math.cos(time * 0.3 + seed * 0.7);
  
  const moveDir = new Vector3(driftX, 0, driftZ).normalize();
  
  // Add a slight jitter/vibration
  const jitter = new Vector3(
    Math.sin(time * 10) * 0.05,
    0,
    Math.cos(time * 10) * 0.05
  );
  
  return moveDir.add(jitter).normalize().multiplyScalar(speed);
}
