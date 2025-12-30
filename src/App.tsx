import { useStore } from '@nanostores/react';
import { Canvas } from './components/Core/Canvas';
import { HUD } from './components/UI/HUD';
import { Tutorial } from './components/UI/Tutorial';
import { $restartTrigger } from './stores/restart';
import './styles/global.css';

function App() {
  const restartTrigger = useStore($restartTrigger);

  return (
    <div className="app">
      <Tutorial />
      <Canvas key={restartTrigger} />
      <HUD />
    </div>
  );
}

export default App;

