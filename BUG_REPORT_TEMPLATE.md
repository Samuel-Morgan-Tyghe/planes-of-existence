# Bug Report Template

When something isn't working, use this template to help me understand the issue:

## Quick Checklist

**Before reporting, check:**
- [ ] Browser console (F12) for errors - copy/paste any red errors
- [ ] What you expected to happen
- [ ] What actually happened
- [ ] Steps to reproduce (what buttons/keys you pressed)

## Bug Report Format

```
**What I was trying to do:**
[Describe the action - e.g., "Move the player", "Shoot at enemies", "Collect loot"]

**What happened instead:**
[Describe what actually happened - e.g., "Player didn't move", "Game froze", "Health kept decreasing"]

**Console Errors:**
[Copy/paste any errors from browser console (F12)]

**Steps to reproduce:**
1. [First step]
2. [Second step]
3. [What happened]

**Screenshots:**
[If helpful, describe what you see or attach screenshot]

**Additional info:**
[Any other relevant details]
```

## Common Issues & Quick Fixes

### Game won't start / Black screen
- Check browser console (F12) for errors
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Check if dev server is running (`npm run dev`)

### Player not moving
- Check if WASD keys are working (try typing in browser address bar)
- Check console for physics errors
- Try switching planes (Tab key)

### Enemies not visible
- Check if enemies spawned (should see colored cubes)
- Check camera angle (try switching planes)
- Check console for rendering errors

### Health decreasing unexpectedly
- Check console for errors
- Enemies might be attacking immediately on spawn (should have 2s delay)
- Check if you're standing too close to enemies

### Projectiles not firing
- Press J or click mouse
- Check console for errors
- Check if player position is updating

## Debug Mode

To enable debug logging, add this to your browser console:
```javascript
localStorage.setItem('debug', 'true');
```

Then refresh and check console for detailed logs.

