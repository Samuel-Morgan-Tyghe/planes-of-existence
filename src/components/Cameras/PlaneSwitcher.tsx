import { useEffect } from 'react';
import { $plane, switchPlane, togglePause } from '../../stores/game';
import { restartRun } from '../../stores/restart';
import type { PlaneType } from '../../types/game';

const PLANES: PlaneType[] = ['2D', 'ISO', 'FPS'];

export function PlaneSwitcher() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Tab to cycle through planes
      if (e.key === 'Tab') {
        e.preventDefault();
        const current = $plane.get();
        const currentIndex = PLANES.indexOf(current);
        const nextIndex = (currentIndex + 1) % PLANES.length;
        switchPlane(PLANES[nextIndex]);
      }

      // Number keys to jump directly to plane
      if (e.key === '1') {
        e.preventDefault();
        switchPlane('2D');
      }
      if (e.key === '2') {
        e.preventDefault();
        switchPlane('ISO');
      }
      if (e.key === '3') {
        e.preventDefault();
        switchPlane('FPS');
      }

      // R to restart run
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restartRun();
      }

      // Escape to pause
      if (e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return null;
}

