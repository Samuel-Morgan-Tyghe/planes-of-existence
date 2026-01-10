import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';

interface FloatingTextProps {
    position: [number, number, number];
    text: string;
    color?: string;
    onComplete: () => void;
}

export function FloatingText({ position, text, color = 'white', onComplete }: FloatingTextProps) {
    const [offsetY, setOffsetY] = useState(0);
    const [opacity, setOpacity] = useState(1);
    const lifeTime = useRef(0);
    const maxLife = 1.0;

    useFrame((_, delta) => {
        lifeTime.current += delta;
        if (lifeTime.current > maxLife) {
            onComplete();
            return;
        }

        // Float up
        setOffsetY((prev) => prev + delta * 1.5);
        // Fade out
        if (lifeTime.current > 0.5) {
            setOpacity(1 - (lifeTime.current - 0.5) * 2);
        }
    });

    return (
        <group position={[position[0], position[1] + 1.5 + offsetY, position[2]]}>
            <Html center style={{ pointerEvents: 'none' }}>
                <div style={{
                    color: color,
                    fontWeight: 'bold',
                    fontSize: '24px',
                    textShadow: '2px 2px 0px black, -1px -1px 0 #000',
                    opacity: opacity,
                    transform: `scale(${1 + Math.sin(lifeTime.current * 10) * 0.2})` // Pop animation
                }}>
                    {text}
                </div>
            </Html>
        </group>
    );
}
