import { useStore } from '@nanostores/react';
import { $playerYaw } from '../../../stores/game';

export function Compass() {
  const yaw = useStore($playerYaw);
  
  // Convert yaw to degrees, normalized 0-360
  // Three.js Use standard rotation: 0 = +Z (South), 90 = +X (East), 180 = -Z (North), 270 = -X (West)
  // Wait, Three.js: -Z is forward. 
  // If yaw is 0, we look down -Z. That is "North" in many games.
  // Actually, let's just make sure "N" points to -Z.
  // Yaw is rotation about Y axis.
  const deg = (yaw * 180) / Math.PI;
  
  // We want to rotate the compass STRIP opposite to player
  // Or rotate an arrow. Let's do a strip for that "FPS" feel.
  // A strip needs to show N, E, S, W.
  // Simple CSS implementation:
  
  return (
    <div style={{
      position: 'absolute',
      top: '50px',
      right: '20px',
      width: '150px',
      height: '24px',
      backgroundColor: 'rgba(0,0,0,0.5)',
      border: '1px solid #00ffff',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Center Marker */}
      <div style={{
         position: 'absolute',
         left: '50%',
         top: 0,
         bottom: 0,
         width: '2px',
         backgroundColor: '#ffff00',
         zIndex: 2,
         transform: 'translateX(-50%)'
      }} />
      
      {/* Compass Strip */}
      <div style={{
        position: 'absolute',
        left: '50%',
        display: 'flex',
        gap: '40px', // Spacing between cardinal points
        transform: `translateX(calc(-50% + ${-deg * 1.5}px))`, // Factor determines scroll speed
        transition: 'transform 0.1s linear',
        color: '#00ff00',
        fontWeight: 'bold',
        fontSize: '12px'
      }}>
         {/* Repeating strip to handle wrap-around visually (simple primitive version) */}
         {/* Detailed implementation: Render N E S W multiple times */}
         {/* -360 to +360 coverage */}
         <span>N</span><span>NE</span><span>E</span><span>SE</span><span>S</span><span>SW</span><span>W</span><span>NW</span>
         <span>N</span><span>NE</span><span>E</span><span>SE</span><span>S</span><span>SW</span><span>W</span><span>NW</span>
         <span>N</span><span>NE</span><span>E</span><span>SE</span><span>S</span><span>SW</span><span>W</span><span>NW</span>
      </div>
    </div>
  );
}
