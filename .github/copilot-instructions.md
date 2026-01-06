# Copilot Instructions: Neon Survival Shooter

## Project Overview
Single-file HTML5 Canvas game with vector-only rendering (no images). Pure JavaScript implementation with emphasis on visual effects using canvas compositing and glow effects.

## Architecture & Core Systems

### Game Loop Pattern
- **Update-Render cycle**: `gameLoop()` → `update()` → `render()` on every frame via `requestAnimationFrame`
- **State management**: Single `game` object tracks score, difficulty, time, and shake effects
- **Entity arrays**: `enemies[]`, `bullets[]`, `particles[]` managed with reverse iteration for safe splice operations

### Physics Model
- **Player movement**: Acceleration-based (0.5 speed) + friction decay (0.92) for momentum feel
- **Boundary handling**: Hard stop at canvas edges with velocity reset (not bounce)
- **Collision detection**: Simple circle-to-circle distance checks via `circleCollision(a, b)`

### Key Rendering Techniques
All visual effects achieved through canvas compositing—this is critical to the game's aesthetic:

1. **Trail effect**: `fillRect()` with `rgba(0, 0, 0, 0.15)` instead of full clear
2. **Neon glow**: `ctx.shadowBlur` + `ctx.shadowColor` for all entities
3. **Additive blending**: `ctx.globalCompositeOperation = 'lighter'` for bright-on-dark overlays
4. **Layered rendering**: Grid → Particles → Bullets → Enemies → Player → UI (opaque last)

### Particle System Types
- **Ring particles**: Expanding circles (`expandSpeed: 2`) for explosion halos, rendered as strokes
- **Spark particles**: Fast-moving filled circles with velocity decay for debris
- Both use `alpha = life / maxLife` fade-out and require `type` field to differentiate rendering

## Game Design Patterns

### Auto-Fire Mechanic
Bullets spawn when `speed > 0.5` and fire rate cooldown elapsed, using `Math.atan2(player.vy, player.vx)` for direction. Movement IS aiming—there's no separate aim control.

### Difficulty Scaling
Linear ramp: `difficulty = 1 + time / 3600`, affects:
- Enemy spawn rate: `120 - (difficulty * 10)` frames minimum
- Enemy speed: `1 + difficulty * 0.2`

### Camera Shake
Set `game.shakeAmount` on collision, apply random offset in render via `ctx.translate()`, decay by 0.9× each frame. Must be within `ctx.save()/restore()` block to isolate from UI.

## Development Conventions

### Code Organization
Functions grouped by purpose with comment headers: INITIALIZATION, GAME LOOP, UPDATE, SPAWN, COLLISIONS, RENDER. Maintain this structure when adding features.

### Entity Object Shape
All entities (player, enemies, bullets, particles) share: `x`, `y`, `radius`, `color` for consistent rendering and collision. Add role-specific fields (e.g., `hp`, `vx`, `type`) as needed.

### Canvas Context Pattern
Always reset `shadowBlur` and `globalAlpha` to defaults after rendering groups to prevent leakage. UI rendering must reset `globalCompositeOperation` to `'source-over'`.

## Testing & Debugging

### Quick Test Commands
```bash
# Serve locally (Python 3)
python3 -m http.server 8000

# Or with Node.js
npx http-server -p 8000
```
Open http://localhost:8000 in browser—no build step required.

### Common Issues
- **Trails not working**: Check alpha channel in frame clear `fillRect()`
- **Dim glow**: Verify `ctx.globalCompositeOperation = 'lighter'` is active before entity rendering
- **Collision detection off**: Ensure `.radius` property exists on all entities
- **Array mutation bugs**: Always iterate backwards (`i--`) when splicing during update loops

## File Roles
- **game.js**: All game logic, single entry point at `init()`
- **index.html**: Minimal canvas mount + UI overlay
- **style.css**: Neon border effect on canvas, centered layout, monospace typography

## Extension Points
When adding features, prefer:
- New particle types over sprite assets (keep vector-only aesthetic)
- Canvas effects (blur, composite modes) over external libraries
- Single-file additions to game.js maintaining function-based structure
