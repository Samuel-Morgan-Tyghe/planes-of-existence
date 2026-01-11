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
   - Prevent entities from clipping through walls or floors.

4. **State Management (Nanostores)**:
   - **High-Frequency State**: Use Nanostores for state that updates many times per second (e.g., projectiles, enemy positions, visual effects). React `useState` can drop updates in high-speed loops like `useFrame`.
   - **Global Game State**: Use Nanostores for state that needs to be accessed by multiple systems (e.g., inventory, drops, game progress).
   - **Migration Candidates**:
     - **Enemy Projectiles**: Move from `Enemy.tsx` local state to a global or scoped Nanostore.
     - **Drops/Pickups**: Move from `DropManager.tsx` to a global store (e.g., `src/stores/drops.ts`).
     - **Visual Effects**: Move from `EffectsManager.tsx` custom callback system to a Nanostore.
     - **Player Inventory**: Move keys and bombs from `DropManager.tsx` to `src/stores/player.ts`.
     - **Enemy Positions**: Replace `window.__enemyPositions` with a reactive Nanostore Map.
     - **Camera State**: Move `zoomScale` and `shakeIntensity` from `CameraManager.tsx` to `src/stores/game.ts`.
     - **Loot State**: Move `lootItems` from `LootSpawner.tsx` to a global store.
     - **Enemy Visual State**: Move `isAttacking` and `damageFlash` to a reactive map if other systems need to sync with them.
   - **Data Structures**:
     - **Object Maps vs Arrays**: When managing collections of entities (projectiles, enemies, drops), prefer using `Record<number, T>` or `Map<number, T>` over arrays. This allows for O(1) lookups and removals by ID, which is critical for performance in high-frequency updates.

## 5. Project Context & Runtime

### Architecture
-   **Core**: React, Three.js (R3F), Rapier Physics.
-   **State**: Nanostores (decoupled from React).
-   **Entry**: `src/App.tsx` handles routing (Game vs Sandbox). `src/components/Core/Scene.tsx` is the main game loop.

### Testing Strategy
-   **Unit Tests (`npm run test`)**: Use Vitest for pure logic (damage, inventory, generation).
-   **E2E Tests (`npx playwright test`)**: Use Playwright for critical flows.
-   **Visual Regression**:
    -   **Sandbox Mode**: Use `/?mode=sandbox` for isolated visual tests (e.g., enemy rendering).
    -   **Avoid Flakiness**: Do not test visuals in the main game loop where random physics/animations occur.

### Sandbox Mode
-   Accessible via `/?mode=sandbox`.
-   Strip away game loop, physics, and HUD.
-   Use `window.sandbox` API to spawn entities and control camera for perfect screenshots.

## 5. Project Context & Runtime

### Architecture
-   **Core**: React, Three.js (R3F), Rapier Physics.
-   **State**: Nanostores (decoupled from React).
-   **Entry**: `src/App.tsx` handles routing (Game vs Sandbox). `src/components/Core/Scene.tsx` is the main game loop.

### Testing Strategy
-   **Unit Tests (`npm run test`)**: Use Vitest for pure logic (damage, inventory, generation).
-   **E2E Tests (`npx playwright test`)**: Use Playwright for critical flows.
-   **Visual Regression**:
    -   **Sandbox Mode**: Use `/?mode=sandbox` for isolated visual tests (e.g., enemy rendering).
    -   **Avoid Flakiness**: Do not test visuals in the main game loop where random physics/animations occur.

### Sandbox Mode
-   Accessible via `/?mode=sandbox`.
-   Strip away game loop, physics, and HUD.
-   Use `window.sandbox` API to spawn entities and control camera for perfect screenshots.
