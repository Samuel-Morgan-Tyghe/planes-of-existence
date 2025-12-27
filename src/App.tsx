import { Canvas } from './components/Core/Canvas';
import { HUD } from './components/UI/HUD';
import { Tutorial } from './components/UI/Tutorial';
import './styles/global.css';

function App() {
  return (
    <div className="app">
      <Tutorial />
      <Canvas />
      <HUD />
    </div>
  );
}

export default App;

