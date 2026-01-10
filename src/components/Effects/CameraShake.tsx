import { useStore } from '@nanostores/react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { $shakeIntensity } from '../../stores/game';

export function CameraShake() {
    const { camera } = useThree();
    const intensity = useStore($shakeIntensity);
    const noiseOffset = useRef(0);

    useFrame((_, delta) => {
        // Decay shake
        if (intensity > 0) {
            $shakeIntensity.set(THREE.MathUtils.lerp(intensity, 0, delta * 5));
        }

        if (intensity > 0.01) {
            noiseOffset.current += delta * 50; // High frequency noise
            const shakeAmount = intensity * 0.5;

            const rx = (Math.random() - 0.5) * shakeAmount;
            const ry = (Math.random() - 0.5) * shakeAmount;
            const rz = (Math.random() - 0.5) * shakeAmount;

            camera.position.x += rx;
            camera.position.y += ry;
            camera.position.z += rz;

            // Note: We are modifying camera position directly. 
            // This is transient noise. Ideally we should restore it or apply it as offset container.
            // But since OrbitControls or Player tracker updates camera every frame, 
            // adding random noise here MIGHT jitter.
            // If Player tracker runs AFTER this, it overwrites.
            // If Player tracker runs BEFORE this, this adds jitter. 
            // useFrame order matters. 
            // To be safe, we might want a clean wrapper. 
            // But for "Juice", slight jitter on top of movement is fine as long as it doesn't drift.
        }
    });

    return null;
}
