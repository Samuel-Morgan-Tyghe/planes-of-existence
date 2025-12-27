# How I Test Games with Browser Automation

## Browser Automation Tools

I use **MCP Browser Extension** tools that allow me to programmatically interact with web pages, similar to Puppeteer or Playwright but integrated into Cursor.

## Available Testing Methods

### 1. Keyboard Input Simulation
```javascript
browser_press_key('w')      // Press W key
browser_press_key('Tab')    // Press Tab
browser_press_key('Space')  // Press Spacebar
```

**What I can test:**
- Movement controls (WASD)
- Plane switching (Tab, 1/2/3)
- Shooting (J, Click)
- Any keyboard input

### 2. Page Evaluation
```javascript
browser_evaluate(() => {
  // Run any JavaScript in the page context
  return document.querySelector('canvas').width;
})
```

**What I can check:**
- Game state (health, inventory, stats)
- DOM elements (HUD, UI)
- JavaScript variables
- Canvas rendering status

### 3. Console Monitoring
```javascript
browser_console_messages  // Get all console logs/errors
```

**What I can detect:**
- JavaScript errors
- React errors
- Physics engine errors
- Runtime warnings

### 4. Visual Inspection
```javascript
browser_take_screenshot()     // Capture current view
browser_snapshot()           // Get accessibility tree
```

**What I can see:**
- Visual rendering
- UI layout
- Element positions

### 5. Navigation & Waiting
```javascript
browser_navigate(url)        // Go to URL
browser_wait_for(time: 2)    // Wait 2 seconds
browser_wait_for(text: "Ready") // Wait for text to appear
```

## Example Test Sequence

Here's what I did in the test run:

1. **Navigate** to `http://localhost:3000/`
2. **Wait** 3 seconds for page to load
3. **Check** console for errors
4. **Evaluate** initial state (plane, health)
5. **Press Tab** to switch planes
6. **Check** if plane changed in HUD
7. **Press WASD** to test movement
8. **Press J** to test shooting
9. **Monitor** console for errors
10. **Take screenshot** to see visual state

## Limitations

- **Visual confirmation**: I can't "see" the 3D scene directly - I rely on:
  - Screenshots (2D images)
  - Console errors
  - HUD text updates
  - JavaScript state checks

- **Real-time feedback**: There's a delay between actions and checking results

- **Physics visualization**: Can't directly see if physics is working, only detect errors

## What I Found in This Test

✅ **Working:**
- Plane switching (Tab key)
- HUD updates
- Game loads without React errors

❌ **Issues:**
- Rapier physics error (recursive object access)
- Canvas may not be rendering 3D scene
- Projectiles may not spawn

## To Test Yourself

You can manually test by:
1. Opening `http://localhost:3000/` in your browser
2. Pressing keys and watching the HUD
3. Checking browser console (F12) for errors
4. Visually confirming movement, shooting, etc.

The browser automation lets me test programmatically, but manual testing gives you the best visual feedback!

