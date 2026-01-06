import { useStore } from '@nanostores/react';
import { $inventory } from '../../../stores/game';

export function InventoryPanel() {
  const inventory = useStore($inventory);

  return (
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
        pointerEvents: 'none',
      }}
    >
      <div style={{ marginBottom: '4px', color: '#00ff00' }}>Items:</div>
      {Object.keys(inventory).length === 0 ? (
        <div style={{ color: '#666' }}>No items</div>
      ) : (
        Object.entries(inventory).map(([itemId, count]) => (
          <div key={itemId} style={{ marginLeft: '8px', color: '#00ff00' }}>
            {itemId}: x{count}
          </div>
        ))
      )}
    </div>
  );
}
