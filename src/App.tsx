import { KeyboardControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { Scene } from './components/Core/Scene';
import { HUD } from './components/UI/HUD';
import './styles/global.css';

function App() {
  const keyboardMap = useMemo(() => [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'attack', keys: ['Enter', 'Delete', 'Click'] }, // Click handled separately but good to have mapping
    { name: 'interact', keys: ['e', 'E'] }, // Throw bomb / Interact
    { name: 'shift', keys: ['Shift'] },
    { name: 'escape', keys: ['Escape'] },
  ], []);

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="app">
        <Canvas shadows camera={{ position: [0, 15, 10], fov: 50 }}>
          <Scene />
        </Canvas>
        <HUD />
      </div>
    </KeyboardControls>
  );
}

export default App;

