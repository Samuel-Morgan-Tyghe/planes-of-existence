import { EnemyDefinition } from '../../../types/enemies';
import { GlitchVisual } from './GlitchVisual';
import { TurretVisual } from './TurretVisual';

interface EnemyVisualsProps {
    definition: EnemyDefinition;
    healthPercent?: number; // Optional for now
}

/**
 * Main dispatcher for Enemy Visuals.
 * Selects the appropriate visual component based on Enemy ID or Type.
 */
export function EnemyVisuals({ definition }: EnemyVisualsProps) {
    const { id, color, size } = definition;

    // Specific Overrides
    if (id === 'turret' || id === 'sniper' || id === 'growth_cannon') {
        return <TurretVisual color={color} size={size} />;
    }

    // Default Style (The "Glitch" aesthetic)
    return <GlitchVisual color={color} size={size} />;
}
