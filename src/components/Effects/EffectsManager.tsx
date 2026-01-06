import { useState } from 'react';
import { HitEffect } from './HitEffect';
import { ImpactEffect } from './ImpactEffect';

interface Effect {
  id: number;
  type: 'hit' | 'impact';
  position: [number, number, number];
  color: string;
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
              onComplete={() => handleEffectComplete(effect.id)}
            />
          );
        }
        return null;
      })}
    </>
  );
}
