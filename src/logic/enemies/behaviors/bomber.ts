import { Vector3 } from 'three';

export function getBomberVelocity(
  baseDirection: Vector3,
  distance: number,
  targetDistance: number,
  moveSpeed: number
): Vector3 {
  const minDistance = targetDistance * 0.6; // ~4.8 units
  const maxDistance = targetDistance; // 8 units

  if (distance < minDistance) {
    // Too close! Back away.
    return baseDirection.clone().negate().multiplyScalar(moveSpeed);
  } else if (distance > maxDistance) {
    // Too far! Approach.
    return baseDirection.clone().multiplyScalar(moveSpeed);
  } else {
    // Comfort zone: Orbit slightly or stay still?
    // Let's add a slow orbit.
    const time = Date.now() / 1000;
    const tangent = new Vector3(-baseDirection.z, 0, baseDirection.x);
    const orbitSpeed = moveSpeed * 0.5;
    return tangent.multiplyScalar(Math.sin(time) * orbitSpeed);
  }
}
