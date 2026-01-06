import { Vector3 } from 'three';

export function getTurretVelocity(): Vector3 {
  // Turrets don't move
  return new Vector3(0, 0, 0);
}
