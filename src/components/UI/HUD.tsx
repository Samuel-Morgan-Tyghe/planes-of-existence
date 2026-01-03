import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { $coins, $currentFloor, $currentRoomId, $enemiesAlive, $floorData, $inventory, $isPaused, $plane, $roomCleared, $showCombatStats, $stats, toggleCombatStats, togglePause } from '../../stores/game';
import { $pixels } from '../../stores/meta';
import { $health, $maxHealth, $maxShield, $position, $shield } from '../../stores/player';
import { debugState } from '../../utils/debug';
import { MiniMap } from './MiniMap';

export function HUD() {
  const health = useStore($health);
  const maxHealth = useStore($maxHealth);
  const shield = useStore($shield);
  const maxShield = useStore($maxShield);
  const plane = useStore($plane);
  const inventory = useStore($inventory);
  const pixels = useStore($pixels);
  const currentFloor = useStore($currentFloor);
  const currentRoomId = useStore($currentRoomId);
  const floorData = useStore($floorData);
  const enemiesAlive = useStore($enemiesAlive);
  const roomCleared = useStore($roomCleared);
  const isPaused = useStore($isPaused);
  const playerPosition = useStore($position);
  const coins = useStore($coins);
  const stats = useStore($stats);
  const showCombatStats = useStore($showCombatStats);

  const [showDebug, setShowDebug] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDeathMessage, setShowDeathMessage] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [damageFlash, setDamageFlash] = useState(0); // 0-1 intensity
  const lastHealthRef = useRef(health);

  const healthPercent = (health / maxHealth) * 100;

  // Flash screen red when taking damage
  useEffect(() => {
    if (health < lastHealthRef.current) {
      setDamageFlash(1.0);
      const interval = setInterval(() => {
        setDamageFlash((prev) => {
          const newVal = Math.max(0, prev - 0.1);
          if (newVal <= 0) clearInterval(interval);
          return newVal;
        });
      }, 50);
      lastHealthRef.current = health;
      return () => clearInterval(interval);
    }
    lastHealthRef.current = health;
  }, [health]);

  // Track mouse position for crosshair
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Show death message when health reaches 0
  useEffect(() => {
    if (health <= 0) {
      setShowDeathMessage(true);
    } else {
      // Hide message immediately when health is restored (restart happened)
      setShowDeathMessage(false);
    }
  }, [health]);

  // Toggle debug with Ctrl+D
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setShowDebug((prev) => !prev);
        }
      }
      // Toggle help with H
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }
      // Toggle combat stats with Ctrl+S
      if (e.key === 's' || e.key === 'S') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleCombatStats();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        fontFamily: 'monospace',
        color: '#00ff00',
      }}
    >
      {/* Damage Flash Overlay - red vignette when hit */}
      {damageFlash > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(255, 0, 0, ${damageFlash * 0.5})`,
            border: `${Math.floor(damageFlash * 30)}px solid rgba(255, 0, 0, ${damageFlash * 0.8})`,
            zIndex: 999,
            pointerEvents: 'none',
            boxShadow: `inset 0 0 ${Math.floor(damageFlash * 200)}px rgba(255, 0, 0, ${damageFlash})`,
          }}
        />
      )}
      {/* Health Bar */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '200px',
          backgroundColor: '#000000',
          border: '2px solid #00ff00',
          padding: '4px',
        }}
      >
        {/* Shield Bar (Overlay) */}
        {shield > 0 && (
            <div
                style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '-2px',
                    width: `${(shield / maxShield) * 100}%`,
                    height: '8px',
                    backgroundColor: '#00ffff',
                    border: '1px solid #00ffff',
                    boxShadow: '0 0 5px #00ffff',
                    transition: 'width 0.3s',
                    zIndex: 2
                }}
            />
        )}
        
        {/* Shield Text */}
        {shield > 0 && (
             <div style={{ 
                 position: 'absolute', top: '-25px', left: '0', 
                 color: '#00ffff', fontSize: '10px', fontWeight: 'bold' 
             }}>
                 SHIELD: {Math.ceil(shield)}
             </div>
        )}

        <div
          style={{
            width: `${healthPercent}%`,
            height: '20px',
            backgroundColor: healthPercent > 50 ? '#00ff00' : healthPercent > 25 ? '#ffff00' : '#ff0000',
            transition: 'width 0.3s',
          }}
        />
        <div style={{ marginTop: '4px', fontSize: '12px' }}>
          HP: {Math.ceil(health)}/{maxHealth}
        </div>
      </div>

      {/* Plane Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: '#000000',
          border: '2px solid #00ff00',
          padding: '8px 16px',
          fontSize: '14px',
        }}
      >
        Plane: {plane}
      </div>

      {/* Floor & Room Info */}
      <div
        style={{
          position: 'absolute',
          top: '70px',
          right: '20px',
          backgroundColor: '#000000',
          border: '2px solid #00ffff',
          padding: '8px 16px',
          fontSize: '14px',
        }}
      >
        Floor {currentFloor + 1} • Room {currentRoomId + 1}/{floorData?.roomCount || 0}
      </div>

      {/* Enemy Counter */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
          right: '20px',
          backgroundColor: roomCleared ? '#002200' : '#220000',
          border: roomCleared ? '2px solid #00ff00' : '2px solid #ff0000',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {roomCleared ? (
          <span style={{ color: '#00ff00' }}>✓ ROOM CLEARED</span>
        ) : (
          <span style={{ color: '#ff6600' }}>Enemies: {enemiesAlive}</span>
        )}
      </div>

      {/* Mini-map */}
      <MiniMap />

      {/* Pixels (Currency) */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          backgroundColor: '#000000',
          border: '2px solid #ffff00',
          padding: '8px',
          fontSize: '14px',
        }}
      >
        Pixels: {pixels}
      </div>

      {/* Coins */}
      <div
        style={{
          position: 'absolute',
          top: '130px',
          left: '20px',
          backgroundColor: '#000000',
          border: '2px solid #ffd700',
          padding: '8px',
          fontSize: '14px',
          color: '#ffd700',
        }}
      >
        Coins: {coins}
      </div>

      {/* Bombs */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          left: '20px',
          backgroundColor: '#000000',
          border: '2px solid #ff4400',
          padding: '8px',
          fontSize: '14px',
          color: '#ff4400',
        }}
      >
        Bombs: {inventory['bomb'] || 0} (E)
      </div>
      {/* Combat Stats */}
      {showCombatStats && (
        <div
          style={{
            position: 'absolute',
            top: '230px',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #00ffff',
            padding: '10px',
            fontSize: '12px',
            color: '#00ffff',
            minWidth: '150px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #00ffff', paddingBottom: '4px' }}>
            COMBAT MODIFIERS
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Damage:</span>
            <span style={{ color: '#ff0000', fontWeight: 'bold' }}>
              x{stats.damage.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Fire Rate:</span>
            <span style={{ color: '#ffff00', fontWeight: 'bold' }}>{stats.fireRate.toFixed(1)}/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Range:</span>
            <span style={{ color: '#0088ff', fontWeight: 'bold' }}>{stats.range.toFixed(1)}s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Proj. Size:</span>
            <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{stats.projectileSize.toFixed(2)}x</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Proj. Speed:</span>
            <span style={{ color: '#00ffff', fontWeight: 'bold' }}>{stats.projectileSpeed.toFixed(1)}</span>
          </div>

          <div style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '8px', borderBottom: '1px solid #ff00ff', paddingBottom: '4px', color: '#ff00ff' }}>
            ARTISTIC ATTRIBUTES
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Sharpness:</span>
            <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{(stats.sharpness * 100).toFixed(0)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Saturation:</span>
            <span style={{ color: '#ff00ff', fontWeight: 'bold' }}>{(stats.saturation * 100).toFixed(0)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Contrast:</span>
            <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{(stats.contrast * 100).toFixed(0)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Brightness:</span>
            <span style={{ color: '#ffff00', fontWeight: 'bold' }}>{(stats.brightness * 100).toFixed(0)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Resolution:</span>
            <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{(stats.resolution * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Inventory */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: '#000000',
          border: '2px solid #00ff00',
          padding: '8px',
          fontSize: '12px',
          maxWidth: '300px',
        }}
      >
        <div style={{ marginBottom: '4px' }}>Items:</div>
        {Object.keys(inventory).length === 0 ? (
          <div style={{ color: '#666' }}>No items</div>
        ) : (
          Object.entries(inventory).map(([itemId, count]) => (
            <div key={itemId} style={{ marginLeft: '8px' }}>
              {itemId}: x{count}
            </div>
          ))
        )}
      </div>

      {/* Controls Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#000000',
          border: '2px solid #00ff00',
          padding: '8px',
          fontSize: '10px',
          opacity: 0.7,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>CONTROLS</div>
        <div>WASD: Move</div>
        <div>Arrow Keys: Shoot</div>
        <div>Tab/1/2/3: Switch Plane</div>
        <div>E: Throw Bomb</div>
        <div>Ctrl+S: Toggle Stats</div>
        <div>Ctrl+D: Debug</div>
        <div style={{ marginTop: '4px', fontSize: '9px', opacity: 0.8 }}>
          Press H for help
        </div>
      </div>

      {/* Crosshair */}
      <div
        style={{
          position: 'fixed',
          top: `${mousePosition.y}px`,
          left: `${mousePosition.x}px`,
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          pointerEvents: 'none',
          zIndex: 1500,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            width: '8px',
            height: '2px',
            backgroundColor: '#00ff00',
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '0',
            width: '8px',
            height: '2px',
            backgroundColor: '#00ff00',
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            width: '2px',
            height: '8px',
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '0',
            width: '2px',
            height: '8px',
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div
          style={{
            position: 'absolute',
            top: '120px',
            left: '20px',
            backgroundColor: '#000000',
            border: '2px solid #ff00ff',
            padding: '8px',
            fontSize: '10px',
            maxWidth: '300px',
            zIndex: 2000,
          }}
        >
          <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>DEBUG INFO</div>
          <div>Enemies: {debugState.enemyCount}</div>
          <div>Projectiles: {debugState.projectileCount}</div>
          <div>Player Pos: [{playerPosition.map(v => v.toFixed(2)).join(', ')}]</div>
          <div style={{ marginTop: '4px', color: '#ffff00' }}>
            Open browser console (F12) to see:
          </div>
          <div style={{ marginLeft: '8px', fontSize: '9px', color: '#ffff00' }}>
            - Distance to each enemy (updated every second)
          </div>
          <div style={{ marginLeft: '8px', fontSize: '9px', color: '#ffff00' }}>
            - Damage logs with enemy ID when attacked
          </div>
          <div style={{ marginTop: '4px', color: '#ff6600' }}>
            Enemy attack range: 2 units (melee)
          </div>
          {debugState.lastError && (
            <div style={{ color: '#ff0000', marginTop: '4px' }}>
              Last Error: {debugState.lastError.message}
            </div>
          )}
        </div>
      )}

      {/* Death Message */}
      {showDeathMessage && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#000000',
            border: '4px solid #ff0000',
            padding: '30px 60px',
            fontSize: '32px',
            fontWeight: 'bold',
            zIndex: 3000,
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ color: '#ff0000', marginBottom: '10px' }}>YOU DIED</div>
          <div style={{ fontSize: '14px', color: '#ffffff', opacity: 0.8 }}>
            Restarting...
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#00ff00',
              textShadow: '0 0 20px #00ff00',
              marginBottom: '20px',
            }}
          >
            PAUSED
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#ffffff',
              marginBottom: '40px',
            }}
          >
            Press ESC to Resume
          </div>
          <button
            onClick={() => togglePause()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '18px',
              marginBottom: '10px',
              width: '200px',
            }}
          >
            RESUME
          </button>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#000000',
            border: '3px solid #00ff00',
            padding: '20px',
            fontSize: '12px',
            maxWidth: '400px',
            zIndex: 2000,
          }}
        >
          <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '16px' }}>
            QUICK HELP
          </div>
          <div style={{ marginBottom: '8px' }}><strong>Movement:</strong> WASD</div>
          <div style={{ marginBottom: '8px' }}><strong>Shoot:</strong> Arrow Keys (hold direction)</div>
          <div style={{ marginBottom: '8px' }}><strong>Throw Bomb:</strong> E</div>
          <div style={{ marginBottom: '8px' }}><strong>Switch Plane:</strong> Tab (cycle) or 1/2/3</div>
          <div style={{ marginTop: '12px', fontSize: '10px', opacity: '0.8' }}>
            <strong>Tip:</strong> Look for floating "ENEMY" labels above colored cubes. Enemies do MELEE attacks (close range, not projectiles) - they hurt you when they get within 2 units. Watch for red "⚠ ATTACKING ⚠" warnings and pulsing red spheres! When you take damage, your screen will flash red and you'll see a red beam from the enemy to you.
          </div>
          <button
            onClick={() => setShowHelp(false)}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              backgroundColor: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold',
            }}
          >
            Close (H)
          </button>
        </div>
      )}
    </div>
  );
}
