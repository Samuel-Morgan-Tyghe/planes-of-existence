import { useStore } from '@nanostores/react';
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Outline,
  Pixelation,
  Selection,
  Vignette
} from '@react-three/postprocessing';
import { $stats } from '../../stores/game';

export function PostProcessing({ children }: { children?: React.ReactNode }) {
  const stats = useStore($stats);

  // Map resolution (1.0 to 0.1) to pixelation granularity (0 to 20)
  const pixelGranularity = Math.max(0, (1 - stats.resolution) * 20);
  const vignetteOffset = Math.max(0, 0.5 - stats.sharpness * 0.5);
  const bloomIntensity = stats.sharpness > 0.8 ? 1.5 : 0.5;

  return (
    <Selection>
      {children}
      <EffectComposer autoClear={false}>
        <HueSaturation
          saturation={stats.saturation - 1.0}
        />
        <BrightnessContrast
          brightness={Math.min(stats.brightness - 1.0, 0.1)}
          contrast={stats.contrast - 0.5}
        />

        <Pixelation granularity={pixelGranularity} />

        <Vignette
          offset={vignetteOffset}
          darkness={0.5}
        />

        <Bloom
          intensity={stats.sharpness > 0.8 ? bloomIntensity : 0}
          luminanceThreshold={0.2}
          mipmapBlur
        />

        <Outline
          blur
          edgeStrength={100}
          width={1000}
          visibleEdgeColor={0xffffff}
          hiddenEdgeColor={0xffffff} // This makes it visible through walls (xRay)
          pulseSpeed={0.5}
        />
      </EffectComposer>
    </Selection>
  );
}
