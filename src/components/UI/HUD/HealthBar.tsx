import { useStore } from '@nanostores/react';
import { $health, $maxHealth, $maxShield, $shield } from '../../../stores/player';

export function HealthBar() {
  const health = useStore($health);
  const maxHealth = useStore($maxHealth);
  const shield = useStore($shield);
  const maxShield = useStore($maxShield);

  const healthPercent = (health / maxHealth) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '200px',
        backgroundColor: '#000000',
        border: '2px solid #00ff00',
        padding: '4px',
        pointerEvents: 'none',
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
            zIndex: 2,
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
      <div style={{ marginTop: '4px', fontSize: '12px', color: '#00ff00' }}>
        HP: {Math.ceil(health)}/{maxHealth}
      </div>
    </div>
  );
}
