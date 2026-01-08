import { useStore } from '@nanostores/react';
import { $hoveredItem } from '../../../stores/game';
import { ITEM_DEFINITIONS } from '../../../types/items';

export function ItemPreview() {
    const hoveredItemId = useStore($hoveredItem);

    if (!hoveredItemId) return null;

    const item = ITEM_DEFINITIONS[hoveredItemId];
    if (!item) return null;

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return '#ffffff';
            case 'uncommon': return '#00ff00';
            case 'rare': return '#00ffff';
            case 'legendary': return '#ff00ff';
            default: return '#ffffff';
        }
    };

    const rarityColor = getRarityColor(item.rarity);

    return (
        <div
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -150%)', // Shift up so it doesn't obscure player
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: `2px solid ${rarityColor}`,
                borderRadius: '8px',
                padding: '12px',
                width: '240px',
                color: '#ffffff',
                fontFamily: 'monospace',
                zIndex: 2000,
                pointerEvents: 'none',
                boxShadow: `0 0 20px ${rarityColor}40`
            }}
        >
            <div style={{
                color: rarityColor,
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '4px',
                textAlign: 'center',
                textTransform: 'uppercase'
            }}>
                {item.name}
            </div>

            <div style={{
                fontSize: '12px',
                color: '#aaaaaa',
                textAlign: 'center',
                marginBottom: '12px',
                fontStyle: 'italic'
            }}>
                [{item.rarity}]
            </div>

            <div style={{
                fontSize: '14px',
                marginBottom: '12px',
                lineHeight: '1.4'
            }}>
                {item.description}
            </div>

            {item.statModifiers && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {Object.entries(item.statModifiers).map(([stat, value]) => {
                        // Check type of value to handle booleans vs numbers
                        const isPositive = typeof value === 'number' ? value > 0 : value === true;
                        const displayValue = typeof value === 'number'
                            ? (value > 0 ? `+${value * 100}%` : `${value * 100}%`)
                            : (value ? 'YES' : 'NO');

                        // Format stat name (camelCase to Title Case)
                        const statName = stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                        return (
                            <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#cccccc' }}>{statName}</span>
                                <span style={{ color: isPositive ? '#00ff00' : '#ff4444', fontWeight: 'bold' }}>
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{
                marginTop: '12px',
                fontSize: '10px',
                textAlign: 'center',
                opacity: 0.8
            }}>
                Walk over to collect
            </div>
        </div>
    );
}
