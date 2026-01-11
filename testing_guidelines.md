# Automated Testing Best Practices (Game Dev)

## Core Philosophy
Game testing requires a hybrid approach of logical unit tests (determinism) and visual integration tests (fidelity).

## 1. Unit Testing (Logic)
-   **Scope**: Game logic, damage calculations, procedural generation, state management (inventory).
-   **Tool**: Vitest.
-   **Best Practice**: Write pure functions where possible. Decouple logic from Three.js/React components.
    *   *Bad*: Testing damage inside a React Component.
    *   *Good*: Testing `calculateDamage(attacker, defender)` pure function.

## 2. E2E Testing (Integration)
-   **Scope**: Critical user flows (Start Game, Die, Shop, Win).
-   **Tool**: Playwright.
-   **Best Practice**:
    *   **Expose State**: Don't rely on pixel-hunting for logic. Expose `window.gameState` to allow tests to assert internal state (`health`, `inventory`).
    *   **Determinism**: Use Seeded RNG (`?seed=TEST`). Force deterministic frame steps if physics flakiness occurs.

## 3. Visual Regression (Rendering)
-   **Scope**: UI/HUD, Rendering correctness, Shaders, Asset loading.
-   **Tool**: Playwright `toHaveScreenshot()`.
-   **Best Practice**:
    *   **Sandbox Mode**: Do NOT test visuals in the main game loop where random animations, particles, or physics can cause flakiness.
    *   **Isolation**: Create a `Sandbox` component (`/?mode=sandbox`) to render entities in a "Studio" environment with fixed lighting and camera.
    *   **Zero Noise**: Disable particles, floating text, and HUD for asset snapshots.

## 4. Debugging & CI
-   **Artifacts**: Always retain video/traces on failure.
-   **Headless**: Ensure tests run in headless mode (use `xvfb` or similar on Linux CI).
-   **Performance**: Use `test.step` to profile slow sections.
