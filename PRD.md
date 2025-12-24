# Product Requirement Document: R.E.N.D.E.R.
## Reality Engine for Non-Defined Entity Resolution

**Version:** 1.0  
**Target Platform:** Web Browser (Desktop-first, mobile-responsive)  
**Tech Stack:** React Three Fiber, Rapier Physics, Nanostores, TypeScript, Vite  
**Developer Experience:** Senior Web Developer (React/TypeScript proficient, Three.js familiar)

---

## 1. Executive Summary

R.E.N.D.E.R. is a roguelite web game where the core mechanic is **Perspective Swapping**. Players navigate a single persistent 3D world viewed through three distinct "Planes of Existence" (camera perspectives), each transforming the gameplay genre:

- **2D Plane (The Flatland)**: Side-scrolling platformer
- **ISO Plane (The Blueprint)**: Top-down tactical dungeon crawler  
- **FPS Plane (The Render)**: First-person immersive sim

The game features:
- Binding of Isaac-style item synergies that behave differently per plane
- Artistic attributes as RPG stats (Sharpness, Saturation, Contrast, Resolution)
- Meta-progression through a persistent "Darkroom" hub
- Procedurally generated levels
- Post-processing effects tied to character stats

---

## 2. Technical Architecture

### 2.1 Core Dependencies

```json
{
  "dependencies": {
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "@react-three/rapier": "^1.3.0",
    "@react-three/postprocessing": "^2.15.0",
    "nanostores": "^0.9.0",
    "@nanostores/react": "^0.9.0",
    "three": "^0.158.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/three": "^0.158.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### 2.2 Directory Structure

```
/src
  /assets
    /models          # GLB/GLTF files (enemies, props)
    /textures        # Image textures
    /audio           # Sound effects, music
    /fonts           # Web fonts for UI
  /components
    /Core            # Canvas setup, Lights, Environment
      - Canvas.tsx
      - Scene.tsx
      - Lighting.tsx
    /Cameras         # Camera management and plane switching
      - CameraManager.tsx
      - PlaneSwitcher.tsx
    /Player          # Player controller and mechanics
      - Player.tsx
      - PlayerController.tsx
      - WeaponSystem.tsx
      - Projectile.tsx
    /World           # Level generation and environment
      - LevelGenerator.tsx
      - GridMap.tsx
      - Obstacle.tsx
      - Wall.tsx
      - Floor.tsx
    /Enemies         # Enemy entities
      - Enemy.tsx
      - EnemySpawner.tsx
    /UI              # User interface components
      - HUD.tsx
      - TerminalIntro.tsx
      - InventoryDisplay.tsx
      - StatsPanel.tsx
      - DarkroomHub.tsx
    /Effects          # Post-processing and visual effects
      - PostProcessing.tsx
      - GlitchEffect.tsx
  /stores            # Nanostores state management
    - game.ts        # Core game state (plane, stats, inventory)
    - player.ts      # Player-specific state (health, position)
    - meta.ts        # Meta-progression (unlocks, upgrades)
  /systems           # Pure game logic (no React)
    - combat.ts      # Weapon firing, damage calculation
    - physics.ts     # Physics constraint helpers
    - items.ts       # Item effect application
    - synergies.ts   # Item synergy detection and effects
  /hooks             # Custom React hooks
    - useKeyboard.ts
    - useGameLoop.ts
    - usePlaneSwitch.ts
  /types             # TypeScript definitions
    - game.ts
    - items.ts
    - player.ts
  /utils             # Helper functions
    - math.ts
    - levelGen.ts
    - constants.ts
  /styles            # CSS/SCSS files
    - global.css
    - ui.css
  App.tsx            # Root component
  main.tsx           # Entry point
```

---

## 3. Core Game Mechanics

### 3.1 The Three Planes

#### Plane A: The Flatland (2D Side-Scrolling)

**Camera:**
- Type: `OrthographicCamera`
- Position: `[0, 0, 50]` (side view)
- Zoom: `40`
- Look At: `[0, 0, 0]`

**Physics Constraints:**
- Lock Z-axis translation (depth)
- Lock all rotations
- Allow X/Y movement only

**Controls:**
- `A/D` or `Left/Right`: Move horizontally
- `Space`: Jump
- `J`: Attack/Shoot

**Gameplay Genre:** Platformer
- Focus on jumping puzzles
- Enemies are "paper cutouts" (2D sprites)
- Depth is illusionary

#### Plane B: The Blueprint (ISO Top-Down)

**Camera:**
- Type: `OrthographicCamera`
- Position: `[20, 20, 20]` (isometric angle)
- Zoom: `30`
- Look At: `[0, 0, 0]`

**Physics Constraints:**
- Lock Y-axis translation (no jumping)
- Lock all rotations
- Allow X/Z movement only

**Controls:**
- `WASD`: Move on horizontal plane
- `Mouse`: Aim direction
- `Left Click`: Attack/Shoot

**Gameplay Genre:** Tactical Dungeon Crawler
- Strategic positioning
- Crowd control
- AoE attacks

#### Plane C: The Render (FPS First-Person)

**Camera:**
- Type: `PerspectiveCamera`
- FOV: `75`
- Position: Parented to Player at `[0, 1.8, 0]` (eye level)

**Physics Constraints:**
- No axis locks
- Full 3D movement
- Mouse look enabled

**Controls:**
- `WASD`: Move
- `Mouse`: Look around
- `Space`: Jump
- `Left Click`: Attack/Shoot
- `Shift`: Sprint

**Gameplay Genre:** First-Person Shooter
- Immersive combat
- Reflex-based gameplay
- "Fear" status effect (unique to this plane)

### 3.2 Plane Switching

**Activation:**
- Press `Tab` to cycle through planes: `2D → ISO → FPS → 2D`
- Or press `1`, `2`, `3` to jump directly to a plane
- Visual "glitch" effect during transition (screen shake, RGB split)

**Constraints:**
- Switching has a 0.5s cooldown
- Momentum is preserved where applicable
- Camera transition is smooth (lerped over 0.3s)

---

## 4. Player Attributes (Artistic Stats)

### 4.1 Attribute Definitions

| Attribute | Gameplay Effect | Visual Shader Effect | Min | Max |
|-----------|----------------|---------------------|-----|-----|
| **Sharpness** | Critical hit chance, Armor penetration | DepthOfField (bokeh), Edge detection | 0.0 | 1.0 |
| **Saturation** | Elemental damage multiplier, Status duration | HueSaturation intensity | 0.0 | 2.0 |
| **Contrast** | Loot find chance, Trap detection | BrightnessContrast | 0.0 | 1.0 |
| **Resolution** | Max health, Armor | Pixelation (inverse: low = pixelated) | 0.1 | 1.0 |

### 4.2 Stat Progression

- Stats start at base values (0.5 for most, 1.0 for Saturation)
- Increased by picking up "Upgrade Orbs" during runs
- Permanent upgrades available in Darkroom hub
- Visual feedback: Character model becomes more "rendered" as Resolution increases

---

## 5. Item System (Glitches)

### 5.1 Item Concept

Items are "Rendering Glitches" or "Editing Tools" that modify player abilities. Each item has:
- A base effect
- Plane-specific modifications
- Synergy potential with other items

### 5.2 Item Examples

#### Dead Pixel
- **Base:** Projectiles pass through obstacles
- **2D:** Bullets phase through platforms
- **ISO:** Bullets ignore walls
- **FPS:** Bullets phase through enemies (first hit only)

#### RGB Split
- **Base:** Triples projectile count
- **2D:** Shoots 3 bullets horizontally spread
- **ISO:** Shoots 3 bullets in 120° arc
- **FPS:** Shoots 3 bullets in vertical spread

#### Motion Blur
- **Base:** Increases movement speed, reduces friction
- **2D:** Faster horizontal movement, longer jump distance
- **ISO:** Faster movement, slide on stop
- **FPS:** Faster movement, reduced recoil

#### Gaussian Blur
- **Base:** Spread shot pattern
- **2D:** Wide horizontal spread
- **ISO:** 360° nova burst
- **FPS:** Shotgun-style spread

#### Clone Tool
- **Base:** Replicates projectiles mid-air
- **2D:** Bullets split into 2 above/below
- **ISO:** Bullets spawn copies in circle
- **FPS:** Bullets bounce and spawn copies on hit

### 5.3 Synergy System

Synergies activate when specific item combinations are collected:

**The Vignette** (Darkness Aura + Color Bleed)
- Creates damaging aura + trail
- **2D:** Vertical death wall, ground paint
- **ISO:** Circular AoE, Tron-style walls
- **FPS:** Screen-edge damage, gas cloud trail

**The Recursive Render** (Gaussian Blur + Clone Tool)
- Spread shots that replicate
- **2D:** Wall of bullets
- **ISO:** Bullet hell generator
- **FPS:** Bank-shot mechanics

### 5.4 Item Storage

Items are stored in Nanostores as a map:
```typescript
$inventory: map<string, number> // itemId -> count/level
```

---

## 6. Combat System

### 6.1 Weapon Firing Logic

The weapon system uses a "middleware" pattern:

1. Base projectile data is created
2. Current plane is checked
3. Inventory items are iterated, each modifying projectile data
4. Synergies are detected and applied
5. Final projectile is spawned

### 6.2 Damage Calculation

```
Base Damage = 10
+ (Sharpness * 5) // Crit chance
+ (Saturation * 3) // Elemental bonus
= Final Damage
```

### 6.3 Projectile Behavior

Projectiles are RigidBody objects with:
- Velocity vector
- Lifetime (despawn after X seconds)
- Collision groups (player, enemy, wall)
- Visual representation (mesh + material)

---

## 7. Level Generation

### 7.1 Grid-Based System

Levels are generated from a 2D array:

```typescript
type TileType = 0 | 1 | 2 | 3;
// 0 = Floor (walkable)
// 1 = Wall (obstacle)
// 2 = Enemy spawn
// 3 = Loot/Upgrade spawn
```

### 7.2 Procedural Generation Algorithm

1. Create empty grid (e.g., 20x20)
2. Place outer walls
3. Use BSP or random walk to create rooms
4. Connect rooms with corridors
5. Place enemies and loot based on difficulty curve
6. Ensure all areas are reachable in all planes

### 7.3 Rendering Per Plane

- **2D:** Walls become background/foreground platforms
- **ISO:** Walls become maze barriers
- **FPS:** Walls become 3D cover objects

---

## 8. Meta-Progression: The Darkroom

### 8.1 Hub Concept

After death, player returns to "The Darkroom" - a persistent hub area.

### 8.2 Upgrade Categories

#### Resolution Upgrades
- Start as pixelated blob (8-bit)
- Upgrade to smoother models
- Increases max health

#### Palette Unlocks
- Start in grayscale
- Unlock colors: Red (fire), Blue (ice), Green (healing)
- Each color unlocks new item types

#### Lens Cap (Plane Switching)
- Unlock ability to switch planes mid-run
- Cooldown reduction upgrades
- "Plane Lock" item (stay in one plane for X seconds)

#### Starting Equipment
- Better base weapon
- Starting items
- Stat bonuses

### 8.3 Currency

- **Pixels:** Collected during runs, spent on upgrades
- **Fragments:** Dropped by bosses, unlock new content

---

## 9. UI/UX Requirements

### 9.1 Terminal Intro (Name Entry)

**Component:** `TerminalIntro.tsx`

**Behavior:**
1. Player enters name
2. First attempt: "Ridiculous. Try again."
3. Second attempt: "Worse than the first. Denied."
4. Third attempt: "Fine. We'll call you [name]."

**Implementation:**
- Simple React form with input
- State tracks attempt count
- Hardcoded responses (can be replaced with GPT API later)
- Styled as retro terminal (green text on black)

### 9.2 HUD Elements

**Always Visible:**
- Health bar (visualized as "Resolution" - pixelated when low)
- Current plane indicator (2D/ISO/FPS badge)
- Minimap (top-right, shows current room)

**Contextual:**
- Inventory display (bottom, shows collected items)
- Stats panel (toggle with `I` key)
- Damage numbers (floating text)

### 9.3 Visual Style

- **Aesthetic:** "Unrendered" / "Corrupted Asset"
- Wireframe materials by default
- Glitch effects on transitions
- Post-processing tied to stats
- Low-poly, voxel-inspired art style

---

## 10. Post-Processing Effects

### 10.1 Effect Mapping

```typescript
// Sharpness
<DepthOfField 
  focusDistance={0} 
  focalLength={0.02} 
  bokehScale={sharpness * 2}
/>

// Saturation
<HueSaturation saturation={saturation} />

// Contrast
<BrightnessContrast contrast={contrast} />

// Resolution (inverse pixelation)
<Pixelation granularity={10 - (resolution * 10)} />

// Additional effects
<Vignette eskil={false} offset={0.1} darkness={1.1} />
<Glitch active={isGlitching} />
```

### 10.2 Dynamic Updates

Effects update reactively based on Nanostores state. Use `useStore` hook to subscribe to attribute changes.

---

## 11. State Management (Nanostores)

### 11.1 Core Stores

**`stores/game.ts`:**
```typescript
import { atom, map } from 'nanostores';

export type PlaneType = '2D' | 'ISO' | 'FPS';

export const $plane = atom<PlaneType>('2D');
export const $stats = map({
  sharpness: 0.5,
  saturation: 1.0,
  contrast: 0.5,
  resolution: 1.0,
});
export const $inventory = map<string, number>({});
export const $currentRoom = atom<number>(0);
export const $isPaused = atom<boolean>(false);
```

**`stores/player.ts`:**
```typescript
export const $health = atom<number>(100);
export const $maxHealth = atom<number>(100);
export const $position = atom<[number, number, number]>([0, 0, 0]);
```

**`stores/meta.ts`:**
```typescript
export const $pixels = atom<number>(0); // Currency
export const $fragments = atom<number>(0);
export const $unlocks = map<string, boolean>({});
export const $upgrades = map<string, number>({});
```

### 11.2 Actions

Create action functions for state mutations:
```typescript
export const switchPlane = (plane: PlaneType) => {
  $plane.set(plane);
};

export const addItem = (itemId: string) => {
  const current = $inventory.get()[itemId] || 0;
  $inventory.setKey(itemId, current + 1);
};

export const updateStat = (stat: keyof typeof $stats, value: number) => {
  $stats.setKey(stat, value);
};
```

---

## 12. Physics Implementation

### 12.1 Rapier Setup

```typescript
import { Physics } from '@react-three/rapier';

<Canvas>
  <Physics gravity={[0, -9.81, 0]}>
    {/* Game objects */}
  </Physics>
</Canvas>
```

### 12.2 Collision Groups

```typescript
export const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  WALL: 0x0004,
  PROJECTILE: 0x0008,
  LOOT: 0x0010,
};
```

### 12.3 Physics Constraints Per Plane

**2D Plane:**
```typescript
rigidBody.setEnabledTranslations(true, true, false, true); // Lock Z
rigidBody.lockRotations(true, true);
```

**ISO Plane:**
```typescript
rigidBody.setEnabledTranslations(true, false, true, true); // Lock Y
rigidBody.lockRotations(true, true);
```

**FPS Plane:**
```typescript
rigidBody.setEnabledTranslations(true, true, true, true); // All free
// Rotation handled by mouse look
```

---

## 13. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install and configure React Three Fiber
- [ ] Install Rapier physics
- [ ] Install Nanostores
- [ ] Create basic Canvas with ground plane
- [ ] Create Player cube with RigidBody
- [ ] Implement basic WASD movement
- [ ] Create `stores/game.ts` with $plane atom

### Phase 2: Camera System (Week 1-2)
- [ ] Create `CameraManager` component
- [ ] Implement three camera types (Ortho 2D, Ortho ISO, Perspective FPS)
- [ ] Add plane switching logic (Tab key)
- [ ] Add smooth camera transitions
- [ ] Implement physics locks based on active plane
- [ ] Test movement constraints per plane

### Phase 3: Post-Processing (Week 2)
- [ ] Install `@react-three/postprocessing`
- [ ] Create `PostProcessing` component
- [ ] Connect effects to Nanostores stats
- [ ] Implement Sharpness, Saturation, Contrast, Resolution effects
- [ ] Add visual feedback for stat changes

### Phase 4: Combat System (Week 2-3)
- [ ] Create `WeaponSystem` component
- [ ] Implement projectile spawning
- [ ] Create `Projectile` component with RigidBody
- [ ] Implement damage calculation
- [ ] Add collision detection (player/enemy/wall)
- [ ] Create basic enemy AI

### Phase 5: Item System (Week 3-4)
- [ ] Define item data structure
- [ ] Create item pickup system
- [ ] Implement item effect application
- [ ] Create synergy detection system
- [ ] Implement plane-specific item behaviors
- [ ] Add visual item representation

### Phase 6: Level Generation (Week 4)
- [ ] Create `LevelGenerator` utility
- [ ] Implement grid-based map generation
- [ ] Create `GridMap` component to render map
- [ ] Add room/corridor generation
- [ ] Implement enemy/loot placement
- [ ] Test level generation across all planes

### Phase 7: UI Systems (Week 4-5)
- [ ] Create `TerminalIntro` component
- [ ] Implement name entry with mock AI responses
- [ ] Create `HUD` component
- [ ] Add health bar, plane indicator, minimap
- [ ] Create `InventoryDisplay` component
- [ ] Create `StatsPanel` component

### Phase 8: Meta-Progression (Week 5)
- [ ] Create `DarkroomHub` component
- [ ] Implement upgrade system
- [ ] Add currency (Pixels) collection
- [ ] Create upgrade UI
- [ ] Implement persistent saves (localStorage)
- [ ] Connect upgrades to run modifiers

### Phase 9: Polish & Balance (Week 6)
- [ ] Add sound effects
- [ ] Add music
- [ ] Implement boss fights
- [ ] Balance item synergies
- [ ] Add particle effects
- [ ] Performance optimization
- [ ] Bug fixes

---

## 14. Key Implementation Details

### 14.1 Camera Switching

```typescript
// CameraManager.tsx
import { useStore } from '@nanostores/react';
import { $plane } from '../stores/game';

export function CameraManager() {
  const plane = useStore($plane);
  
  return (
    <>
      <OrthographicCamera 
        makeDefault={plane === '2D'} 
        position={[0, 0, 50]} 
        zoom={40}
      />
      <OrthographicCamera 
        makeDefault={plane === 'ISO'} 
        position={[20, 20, 20]} 
        zoom={30}
      />
      <PerspectiveCamera 
        makeDefault={plane === 'FPS'} 
        fov={75}
      />
    </>
  );
}
```

### 14.2 Physics Lock Updates

```typescript
// Player.tsx
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $plane } from '../stores/game';

export function Player() {
  const plane = useStore($plane);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  
  useEffect(() => {
    if (!rigidBodyRef.current) return;
    
    const rb = rigidBodyRef.current;
    
    switch (plane) {
      case '2D':
        rb.setEnabledTranslations(true, true, false, true);
        rb.lockRotations(true, true);
        break;
      case 'ISO':
        rb.setEnabledTranslations(true, false, true, true);
        rb.lockRotations(true, true);
        break;
      case 'FPS':
        rb.setEnabledTranslations(true, true, true, true);
        break;
    }
  }, [plane]);
  
  // ... rest of component
}
```

### 14.3 Item Effect Application

```typescript
// systems/combat.ts
import { $plane, $inventory, $stats } from '../stores/game';

export function fireWeapon(origin: [number, number, number]) {
  const plane = $plane.get();
  const inventory = $inventory.get();
  const stats = $stats.get();
  
  let projectile: ProjectileData = {
    speed: 10 + (stats.sharpness * 5),
    damage: 10,
    behavior: 'linear',
    count: 1,
  };
  
  // Apply item effects
  Object.keys(inventory).forEach(itemId => {
    const item = ITEM_DEFINITIONS[itemId];
    if (item) {
      projectile = item.applyEffect(projectile, plane);
    }
  });
  
  // Spawn projectile(s)
  spawnProjectile(origin, projectile);
}
```

---

## 15. Technical Constraints

### 15.1 Performance Targets

- **FPS:** Maintain 60fps on mid-range hardware
- **Memory:** Keep under 500MB RAM usage
- **Load Time:** Initial load under 3 seconds
- **Bundle Size:** Keep main bundle under 2MB (use code splitting)

### 15.2 Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 14+, Chrome Android

### 15.3 Accessibility

- Keyboard navigation support
- Screen reader compatibility (for UI elements)
- Colorblind-friendly palette
- Configurable controls

---

## 16. Future Enhancements (Out of Scope for MVP)

- GPT integration for name validation (Phase 2)
- Multiplayer support
- Additional planes (4th dimension?)
- More complex boss mechanics
- Steam/Itch.io distribution
- Mobile touch controls
- Save/load system for runs (not just meta-progression)

---

## 17. Success Metrics

- **Engagement:** Average session length > 20 minutes
- **Retention:** 30% of players return after first death
- **Completion:** 10% of players reach final boss
- **Performance:** 95% of sessions maintain 60fps
- **Fun Factor:** Player feedback on item synergies

---

## 18. Risk Mitigation

### 18.1 Technical Risks

**Risk:** Physics constraints not working correctly  
**Mitigation:** Extensive testing per plane, fallback to manual position clamping

**Risk:** Performance issues with many projectiles  
**Mitigation:** Object pooling, culling, LOD system

**Risk:** State management complexity  
**Mitigation:** Use Nanostores atomic updates, keep logic pure

### 18.2 Design Risks

**Risk:** Plane switching feels disorienting  
**Mitigation:** Smooth transitions, visual indicators, tutorial

**Risk:** Item synergies too complex  
**Mitigation:** Start simple, iterate based on playtesting

---

## 19. References & Inspiration

- **Binding of Isaac:** Item synergies, roguelike structure
- **Hades:** Meta-progression, top-down combat
- **Superhot:** Perspective as mechanic
- **FEZ:** 2D/3D perspective switching
- **Antichamber:** Non-Euclidean space concepts

---

## 20. Getting Started with Cursor

### Step 1: Project Setup
```
"Initialize a Vite + React + TypeScript project. Install React Three Fiber, Rapier, Nanostores, and PostProcessing dependencies. Create the directory structure as specified in section 2.2."
```

### Step 2: Basic Scene
```
"Create a Canvas component with a ground plane and a Player cube. Set up Rapier physics. Implement basic WASD movement. Create stores/game.ts with a $plane atom."
```

### Step 3: Camera System
```
"Create CameraManager component that switches between three camera types based on the $plane store. Add Tab key handler to cycle planes. Implement physics locks in Player component based on active plane."
```

Continue with subsequent phases as outlined in Section 13.

---

**End of PRD**

