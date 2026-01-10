import { useState } from 'react';
import { Decal } from './Decal';
import { FloatingText } from './FloatingText';
import { HitEffect } from './HitEffect';
import { ImpactEffect } from './ImpactEffect';

interface Effect {
  id: number;
  type: 'hit' | 'impact' | 'decal' | 'text';
  position: [number, number, number];
  rotation?: [number, number, number]; // For decals
  text?: string; // For text
  color: string;
  size?: number;
  duration?: number;
}

let effectIdCounter = 0;
let effectsCallbacks: ((effect: Effect) => void)[] = [];

export function addEffect(effect: Omit<Effect, 'id'>) {
  const newEffect = { ...effect, id: effectIdCounter++ };
  effectsCallbacks.forEach(cb => cb(newEffect));
}

export function EffectsManager() {
  const [effects, setEffects] = useState<Effect[]>([]);

  // Register callback on mount
  useState(() => {
    const callback = (effect: Effect) => {
      setEffects(prev => [...prev, effect]);
    };
    effectsCallbacks.push(callback);
    return () => {
      effectsCallbacks = effectsCallbacks.filter(cb => cb !== callback);
    };
  });

  const handleEffectComplete = (id: number) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      {effects.map(effect => {
        if (effect.type === 'hit') {
          return (
            <HitEffect
              key={effect.id}
              position={effect.position}
              color={effect.color}
              onComplete={() => handleEffectComplete(effect.id)}
            />
          );
        } else if (effect.type === 'impact') {
          return (
            <ImpactEffect
              key={effect.id}
              position={effect.position}
              color={effect.color}
              size={effect.size}
              onComplete={() => handleEffectComplete(effect.id)}
            />
          );
        } else if (effect.type === 'decal') {
          return (
            <Decal
              key={effect.id}
              position={effect.position}
              rotation={effect.rotation || [0, 0, 0]}
              scale={effect.size}
              onComplete={() => handleEffectComplete(effect.id)}
            />
          );
        } else if (effect.type === 'text') {
          return (
            <FloatingText
              key={effect.id}
              position={effect.position}
              text={effect.text || ''}
              color={effect.color}
              onComplete={() => handleEffectComplete(effect.id)}
            />
          );
        }
        return null;
      })}
    </>
  );
}
