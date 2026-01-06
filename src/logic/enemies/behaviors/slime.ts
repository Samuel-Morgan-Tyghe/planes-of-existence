import { Vector3 } from 'three';

export function getSlimeVelocity(
  baseDirection: Vector3,
  distance: number,
  targetDistance: number,
  moveSpeed: number
): Vector3 {
  const time = Date.now() / 1000;
  
  // Tangential vector for circling
  const tangent = new Vector3(-baseDirection.z, 0, baseDirection.x);
  
  // Adjust Weights: Approach if too far, back away slightly if too close
  const approachWeight = distance > targetDistance ? 0.6 : -0.2; 
  const circlingWeight = 0.8;
  
  const moveDir = new Vector3()
    .addScaledVector(baseDirection, approachWeight)
    .addScaledVector(tangent, circlingWeight)
    .normalize();

  // Add wobble for that slimey feel
  const wobble = new Vector3(
    Math.sin(time * 2) * 0.1,
    0,
    Math.cos(time * 2) * 0.1
  );
  
  return moveDir.add(wobble).normalize().multiplyScalar(moveSpeed);
}
