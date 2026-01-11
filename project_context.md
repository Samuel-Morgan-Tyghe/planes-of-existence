# Project Context: Planes of Existence

## Overview
**Planes of Existence** is a web-based Roguelike game built with React, Three.js (React Three Fiber), and Rapier Physics. It features a "Binding of Isaac" style room-based progression with multiple camera perspectives (2D, Isometric, FPS).

## Tech Stack
-   **Core**: React, TypeScript, Vite.
-   **3D Engine**: Three.js, `@react-three/fiber`, `@react-three/drei`.
-   **Physics**: `@react-three/rapier` (wasm-based physics).
-   **State Management**: `nanostores` (atomic, framework-agnostic state).
-   **Testing**: Vitest (Unit), Playwright (E2E/Visual).

## Architecture

### 1. State Management (`src/stores/`)
Game state is decoupled from React components using Nanostores.
-   `game.ts`: Global game state (inventory, enemies, room status).
-   `player.ts`: Player specific state (health, position, velocity).
-   `projectiles.ts`: Projectile management.

### 2. Core Loop (`src/components/Core/`)
-   `Scene.tsx`: The main game scene. Sets up Lights, Camera, Physics world, and top-level managers.
-   `App.tsx`: Entry point. Handles routing (Sandbox vs Game) and Inputs.

### 3. Entities
-   **Player**: `Player.tsx` handles input-to-physics movement.
-   **Enemies**: `EnemySpawner.tsx` manages spawning logic. `Enemy.tsx` handles individual behavior.
-   **World**: `GridMap.tsx` generates level geometry based on procedural data.

## Runtime & Development
-   **Dev Server**: `npm run dev` (Vite 3000).
-   **E2E Tests**: `npx playwright test`.
-   **Unit Tests**: `npm run test` (Vitest).

## Key Systems
-   **Generation**: Procedural generation logic in `src/utils/floorGen.ts`.
-   **Camera Switching**: `PlaneSwitcher.tsx` toggles between 2D (Top), ISO, and FPS modes.
-   **Events**: Event bus pattern for transient events like Damage, Drops, and Room Clears.
