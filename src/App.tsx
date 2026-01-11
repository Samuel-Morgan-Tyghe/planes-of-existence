import { KeyboardControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Scene } from './components/Core/Scene';
import { ArenaMode } from './components/Debug/ArenaMode';
import { SandboxMode } from './components/Debug/SandboxMode';
import { HUD } from './components/UI/HUD';
import './styles/global.css';

import { useStore } from '@nanostores/react';
import { $bossEnemy, $coins, $currentRoomId, $enemies, $inventory, $stats, addItem, spawnEnemy, useBomb } from './stores/game';
import { $health, $isPlayerVisible, $position } from './stores/player';

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

  const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';
  const mode = new URLSearchParams(window.location.search).get('mode');

  if (mode === 'sandbox') {
    return <SandboxMode />;
  }

  if (mode === 'arena') {
    return (
      <KeyboardControls map={keyboardMap}>
        <ArenaMode />
      </KeyboardControls>
    );
  }

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="app">
        <Canvas shadows={!isTestMode} camera={{ position: [0, 15, 10], fov: 50 }}>
          <Scene isTestMode={isTestMode} />
        </Canvas>
        <HUD />
        <GameStateExposer />
      </div>
    </KeyboardControls>
  );
}

function GameStateExposer() {
  const position = useStore($position);
  const health = useStore($health);
  const roomId = useStore($currentRoomId);
  const stats = useStore($stats);
  const enemies = useStore($enemies);
  const bossEnemy = useStore($bossEnemy);
  const inventory = useStore($inventory);
  const coins = useStore($coins);

  useEffect(() => {
    // console.log('HOOK: Updating window.gameState');
    (window as any).gameState = {
      position,
      health,
      roomId,
      stats,
      enemies,
      bossEnemy,
      inventory,
      addItem,
      spawnEnemy,
      useBomb,
      coins,
      addCoins: (amount: number) => $coins.set($coins.get() + amount),
      setCoins: (amount: number) => $coins.set(amount),
      // Use logic function to ensure clamping/triggers if we import it, or just clamp here.
      // Importing setHealth from player.ts might conflict with local naming if we aren't careful.
      // Let's just clamp manually to match logic for now.
      setHealth: (hp: number) => $health.set(Math.max(0, Math.min(hp, 100))),
      setPlayerVisible: (visible: boolean) => $isPlayerVisible.set(visible),
      buyItem: (itemId: string, cost: number) => {
        const currentCoins = $coins.get();
        if (currentCoins >= cost) {
          $coins.set(currentCoins - cost);
          addItem(itemId);
          return true;
        }
        return false;
      },
      ready: true
    };
  }, [position, health, roomId, stats, enemies, bossEnemy, inventory, coins]);

  return null;
}

export default App;
