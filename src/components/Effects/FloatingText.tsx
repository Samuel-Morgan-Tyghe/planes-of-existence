import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface FloatingTextProps {
    position: [number, number, number];
    text: string;
    color?: string;
    onComplete: () => void;
}

export function FloatingText({ position, text, color = 'white', onComplete }: FloatingTextProps) {
    const lifeTime = useRef(0);
    const maxLife = 1.0;
    const groupRef = useRef<THREE.Group>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useFrame((_, delta) => {
        lifeTime.current += delta;
        if (lifeTime.current > maxLife) {
            onComplete();
            return;
        }

        const progress = lifeTime.current;

        // Float up (Direct Object Update)
        if (groupRef.current) {
            groupRef.current.position.y = position[1] + 1.5 + (progress * 1.5);
        }

        // DOM Update for Opacity/Scale (Avoid React Render Cycle)
        if (textRef.current) {
            let opacity = 1;
            if (progress > 0.5) {
                opacity = 1 - (progress - 0.5) * 2;
            }
            textRef.current.style.opacity = opacity.toString();

            const scale = 1 + Math.sin(progress * 10) * 0.2;
            textRef.current.style.transform = `scale(${scale})`;
        }
    });

    return (
        <group ref={groupRef} position={[position[0], position[1] + 1.5, position[2]]}>
            <Html center style={{ pointerEvents: 'none' }}>
                <div
                    ref={textRef}
                    style={{
                        color: color,
                        fontWeight: 'bold',
                        fontSize: '24px',
                        textShadow: '2px 2px 0px black, -1px -1px 0 #000',
                        opacity: 1,
                        transform: 'scale(1)',
                        willChange: 'transform, opacity'
                    }}>
                    {text}
                </div>
            </Html>
        </group>
    );
}
