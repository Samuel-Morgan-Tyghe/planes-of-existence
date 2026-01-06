import { Vector3 } from 'three';

export function getParasiteVelocity(baseDirection: Vector3): Vector3 {
  // Chaotic Movement: Add orthogonal sine wave
  const ortho = new Vector3(-baseDirection.z, 0, baseDirection.x);
  const time = Date.now() / 200; 
  const sway = Math.sin(time) * 0.8; 
  
  const finalDirection = baseDirection.clone();
  finalDirection.add(ortho.multiplyScalar(sway)).normalize();
  
  return finalDirection;
}
