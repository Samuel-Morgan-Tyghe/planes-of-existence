# R.E.N.D.E.R. Game Variables Registry

This document defines the "Levers" of the game engine - all the variables that can be tweaked to create items, modifiers, and game mechanics.

---

## 1. The Rendering Variables (Artistic Stats)

These control the "Image Quality" of the entity. In gameplay terms, these are your RPG stats (Strength, Magic, etc.).

| Variable Name | Visual Effect | Gameplay Effect (The Mechanic) |
| --- | --- | --- |
| **`Sharpness`** | Edges become crisp; Bokeh/Blur disappears. | **Armor Penetration & Crit.** High sharpness "cuts" through defense. Low sharpness (Blur) deals blunt, non-lethal damage. |
| **`Saturation`** | Colors become vivid and intense. | **Elemental Intensity.** High saturation makes Fire burn longer and Ice freeze harder. Zero saturation (Grayscale) removes all elemental effects (pure physical). |
| **`Contrast`** | Darks get darker, lights get lighter. | **Differentiation (Loot/Traps).** High contrast highlights interactable objects and weak points. Low contrast blends enemies into the background (Camouflage). |
| **`Brightness`** | Overall exposure/light level. | **Aggro Radius.** Low brightness = Stealth (enemies can't see you). High brightness = Taunt/Flashbang (you blind enemies, lowering their accuracy). |
| **`Resolution`** | Pixel count (Blocky vs. Smooth). | **Structural Integrity (Max HP).** <br><br>• **Low Res (8-bit):** You take massive damage but have a tiny hitbox.<br><br>• **High Res (4K):** You are tanky and armored, but your hitbox is perfectly accurate (harder to dodge). |
| **`Gamma`** | Mid-tone balance. | **Luck / Drop Rates.** Adjusting Gamma reveals "hidden" data in the shadows, effectively acting as a "Magic Find" stat. |

---

## 2. The Physics Variables (Engine Glitches)

These manipulate the `Rapier` physics engine constants. These are usually static in games, but here, they are dynamic power-ups.

| Variable Name | Visual Effect | Gameplay Effect (The Mechanic) |
| --- | --- | --- |
| **`Time_Step`** | Animations look stuttery or skipped. | **Tunneling Chance.** <br><br>• **Low (Smooth):** Normal collisions.<br><br>• **High (Laggy):** You move so fast between frames that you can phase through thin walls or bullets (The "Lag Switch" ability). |
| **`Hitbox_Scale`** | No visual change (Model stays same size). | **Precision vs. Safety.**<br><br>• **Scale > 1 (Bloat):** Easier to hit enemies (Magic missile logic).<br><br>• **Scale < 1 (Compress):** You become nearly impossible to shoot (dodging between bullets). |
| **`Friction`** | Characters slide or stop instantly. | **Control.**<br><br>• **0.0 (Ice):** Infinite slide/momentum (good for speedrunning).<br><br>• **1.0 (Sandpaper):** Instant stopping (good for precise platforming). |
| **`Restitution`** | Objects bounce when hitting floors. | **Knockback.**<br><br>• **High:** Enemies fly across the room when hit (Pinball logic).<br><br>• **Low:** Bodies drop dead instantly (Realistic weight). |
| **`Gravity_Scale`** | Floating or Heavy movement. | **Verticality.**<br><br>• **Negative Gravity:** Inverts the level (you walk on the ceiling).<br><br>• **Zero Gravity:** You fly/float until you hit a surface. |

---

## 3. The System Variables (Meta-State)

These affect the game loop and the "Stability" of the simulation.

| Variable Name | Visual Effect | Gameplay Effect (The Mechanic) |
| --- | --- | --- |
| **`System_Stability`** | Screen tearing, artifacts, texture swapping. | **Risk vs. Reward.**<br><br>• **100%:** Standard difficulty.<br><br>• **20%:** Enemies spawn randomly, loot tables break (dropping high-tier items), floors might disappear. |
| **`Latency` (Ping)** | Input delay or rubber-banding. | **"Echo" Attacks.**<br><br>• **High Latency:** Your attacks register 0.5s *after* you click. This allows you to shoot, move, and have the bullet appear at your *old* location (setting traps). |
| **`Render_Distance`** | Fog covers the distance. | **Enemy Spawn Rate.**<br><br>• **Low:** Enemies only spawn when you are 2 feet away (Surprise mechanics).<br><br>• **High:** You can snipe enemies from across the map. |

---

## 4. The Perspective Variables (Camera Lenses)

These are specific to the "Planes of Existence" mechanic.

| Variable Name | Visual Effect | Gameplay Effect (The Mechanic) |
| --- | --- | --- |
| **`FOV` (Field of View)** | Zoom in vs. Fish-eye lens. | **Speed Perception.**<br><br>• **High FOV:** Movement feels faster; peripheral vision increases (spotting flankers).<br><br>• **Low FOV:** Sniper focus; movement feels slower/precise. |
| **`Z_Lock`** | Depth flattening. | **2D/3D Toggle.**<br><br>• **True:** Forces logic into a 2D plane (bullets can't miss "depth-wise").<br><br>• **False:** Enables full 3D dodging. |
| **`Camera_Angle`** | Rotates the world view. | **Secret Reveal.**<br><br>• Rotates walls to reveal hidden doors that are invisible from standard angles (e.g., Fez mechanic). |

---

## Usage Examples for Cursor/AI

When creating items or mechanics, use this shorthand:

### Example 1: Item Creation
> *"Create an item called 'Broken GPU Fan'. It decreases **Stability** by 15%, but increases **Time_Step** (Lag), giving the player a 10% chance to ignore projectile damage due to tunneling."*

### Example 2: Level Modifier
> *"Create a level modifier called 'Deep Fried'. It sets **Saturation** to 200% (doubling fire damage) but sets **Resolution** to 0.2 (reducing Player Max HP by 80%)."*

### Example 3: Status Effect
> *"Create a status effect 'Overclocked'. Increases **Sharpness** by 50% and **Brightness** by 30%, but decreases **Stability** by 20%."*

---

## Implementation Notes

### Current Implementation Status

**Implemented:**
- `Sharpness` - Connected to post-processing (DepthOfField)
- `Saturation` - Connected to post-processing (HueSaturation)
- `Contrast` - Ready for post-processing (BrightnessContrast)
- `Resolution` - Ready for post-processing (Pixelation)
- `Z_Lock` - Implemented via physics constraints per plane

**To Implement:**
- `Brightness` - Post-processing + aggro system
- `Gamma` - Post-processing + loot system
- `Time_Step` - Physics engine modification
- `Hitbox_Scale` - Rapier collider scaling
- `Friction` - Rapier material properties
- `Restitution` - Rapier material properties
- `Gravity_Scale` - Rapier gravity modification
- `System_Stability` - Random event system
- `Latency` - Input delay system
- `Render_Distance` - Fog + enemy spawn distance
- `FOV` - Camera FOV modification
- `Camera_Angle` - Camera rotation system

---

## Variable Ranges

### Rendering Variables
- `Sharpness`: 0.0 - 1.0 (0 = blurry, 1 = sharp)
- `Saturation`: 0.0 - 2.0 (0 = grayscale, 1 = normal, 2 = oversaturated)
- `Contrast`: 0.0 - 1.0 (0 = no contrast, 1 = high contrast)
- `Brightness`: 0.0 - 2.0 (0 = dark, 1 = normal, 2 = bright)
- `Resolution`: 0.1 - 1.0 (0.1 = 8-bit pixelated, 1.0 = 4K smooth)
- `Gamma`: 0.5 - 2.0 (0.5 = dark, 1.0 = normal, 2.0 = bright midtones)

### Physics Variables
- `Time_Step`: 0.016 - 0.1 (normal vs laggy)
- `Hitbox_Scale`: 0.1 - 2.0 (tiny to bloated)
- `Friction`: 0.0 - 1.0 (ice to sandpaper)
- `Restitution`: 0.0 - 1.0 (no bounce to super bouncy)
- `Gravity_Scale`: -1.0 - 2.0 (inverted to heavy)

### System Variables
- `System_Stability`: 0.0 - 1.0 (0% = chaos, 100% = stable)
- `Latency`: 0.0 - 1.0 (0ms to 1000ms delay)
- `Render_Distance`: 5.0 - 100.0 (meters)

### Perspective Variables
- `FOV`: 30 - 120 (degrees)
- `Z_Lock`: boolean (true = 2D, false = 3D)
- `Camera_Angle`: 0 - 360 (degrees rotation)

---

**Last Updated:** 2024-12-24

