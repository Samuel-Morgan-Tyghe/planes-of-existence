import { BOSS_DEFINITIONS, ENEMY_DEFINITIONS } from '../../types/enemies';

export function SandboxControls({ onSpawn, onClear }: { onSpawn: (id: string, isBoss?: boolean) => void, onClear: () => void }) {
    const enemies = Object.values(ENEMY_DEFINITIONS);
    const bosses = Object.values(BOSS_DEFINITIONS);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '250px',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '20px',
            overflowY: 'auto',
            zIndex: 1000,
            borderRight: '1px solid #444'
        }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #666', paddingBottom: '0.5rem' }}>Sandbox Controls</h2>

            <button
                onClick={onClear}
                style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '20px',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                Clear All
            </button>

            <h3 style={{ fontSize: '1rem', color: '#aaa', marginBottom: '10px' }}>Enemies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {enemies.map(e => (
                    <button
                        key={e.id}
                        onClick={() => onSpawn(e.id)}
                        style={{
                            padding: '6px 12px',
                            background: '#333',
                            border: '1px solid #555',
                            color: '#eee',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#444'}
                        onMouseLeave={e => e.currentTarget.style.background = '#333'}
                    >
                        {e.name}
                    </button>
                ))}
            </div>

            <h3 style={{ fontSize: '1rem', color: '#aaa', marginBottom: '10px' }}>Bosses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bosses.map(b => (
                    <button
                        key={b.id}
                        onClick={() => onSpawn(b.id, true)}
                        style={{
                            padding: '6px 12px',
                            background: '#4a3b5c', // Purplish for bosses
                            border: '1px solid #6a5acd',
                            color: '#eee',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#5c4b70'}
                        onMouseLeave={e => e.currentTarget.style.background = '#4a3b5c'}
                    >
                        {b.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
