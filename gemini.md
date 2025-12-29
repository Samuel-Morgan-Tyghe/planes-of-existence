# Project Rules

1. **Terminal Management**: 
   - **STOP OPENING NEW PORTS.** 
   - Do NOT run `npm run dev` if a development server is already running. 
   - Rely on Hot Module Replacement (HMR) for code changes. 
   - Only restart the server if you modify `vite.config.ts` or other build configuration files.

2. **Gameplay Style**: 
   - The game is a "Binding of Isaac"-like roguelike. 
   - Prioritize "Isaac-style" camera behavior (room-based or player-locked with shake), room transitions (spawn at door), and combat feel.

3. **Physics & Collisions**:
   - Ensure robust collision detection between Player, Enemies, and Walls.
   - Prevent entities from clipping through walls or falling through floors.
