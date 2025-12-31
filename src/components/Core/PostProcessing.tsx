import { useStore } from '@nanostores/react';
import {
    Bloom,
    BrightnessContrast,
    EffectComposer,
    HueSaturation,
    Noise,
    Pixelation,
    Vignette
} from '@react-three/postprocessing';
import { $stats } from '../../stores/game';

export function PostProcessing() {
  const stats = useStore($stats);
  
  // Map resolution (1.0 to 0.1) to pixelation granularity (0 to 20)
  // 1.0 resolution = 0 granularity (crisp)
  // 0.1 resolution = 18 granularity (very pixelated)
  const pixelGranularity = Math.max(0, (1 - stats.resolution) * 20);
  
  // Map sharpness to vignette and bloom
  // Higher sharpness = less vignette, more subtle bloom for "focus"
  const vignetteOffset = Math.max(0, 0.5 - stats.sharpness * 0.5);
  const bloomIntensity = stats.sharpness > 0.8 ? 1.5 : 0.5;

  return (
    <EffectComposer disableNormalPass>
      <HueSaturation 
        saturation={stats.saturation - 1.0} // HueSaturation uses offset from 0
      />
      <BrightnessContrast 
        brightness={stats.brightness - 1.0} 
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

      {/* Threshold/Sketch look for extreme contrast/sharpness */}
      <Noise opacity={stats.contrast > 0.9 ? 0.1 : 0} />
    </EffectComposer>
  );
}
