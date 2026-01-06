import { useStore } from '@nanostores/react';
import { $stats } from '../../../stores/game';

export function StatsPanel() {
  const stats = useStore($stats);

  return (
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
        pointerEvents: 'none',
        zIndex: 10,
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

      <div style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '8px', borderBottom: '1px solid #ffffff', paddingBottom: '4px', color: '#ffffff' }}>
        PHYSICS
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>Knockback:</span>
        <span style={{ color: '#ffa500', fontWeight: 'bold' }}>{stats.knockback.toFixed(1)}x</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>KB Resist:</span>
        <span style={{ color: '#ffa500', fontWeight: 'bold' }}>{stats.knockbackResistance.toFixed(1)}x</span>
      </div>
    </div>
  );
}
