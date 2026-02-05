# Zero-Flash Animation Pattern (Two-Stage Render)

## Problem
When rendering complex CSS animations (especially involving 3D transforms, pseudo-elements, or heavy styles) immediately on mount, browsers often render a single "glitch" frame where the element is visible in its default state before the animation kicks in, even if `opacity: 0` is set inline.

## The Solution: Visibility Gate
Use a strict **Two-Stage Render** process. Do not rely on CSS `animation-fill-mode` or initial `opacity` alone.

### Pattern Logic
1.  **Stage 1 (Mount):** Render the container/background immediately.
    *   Set the distinct animated content to `visibility: hidden`.
    *   This removes it from the visual pipeline entirely.
2.  **Stage 2 (Delay):** Wait for a safe buffer (50ms - 200ms).
    *   Use `setTimeout` in a `useEffect`.
3.  **Stage 3 (Reveal):** Switch to `visibility: visible` and fade in opacity.

## Code Template

```javascript
import React, { useState, useEffect } from 'react';

const CinematicComponent = ({ active }) => {
    // 1. Initialize as NOT visible
    const [contentReady, setContentReady] = useState(false);

    useEffect(() => {
        if (active) {
            // 2. Wait for paint/mount (Step 1) to finish
            const timer = setTimeout(() => {
                setContentReady(true); // 3. Trigger content reveal
            }, 100); 
            return () => clearTimeout(timer);
        } else {
            setContentReady(false);
        }
    }, [active]);

    if (!active) return null;

    return (
        <div className="overlay-background">
            {/* Background renders immediately */}
            
            <div style={{
                // Hard Toggle: Physically invisible until ready
                visibility: contentReady ? 'visible' : 'hidden',
                
                // Soft Fade: Smooth entry 
                opacity: contentReady ? 1 : 0, 
                transition: 'opacity 0.2s ease-in'
            }}>
                {/* YOUR COMPLEX ANIMATED CONTENT HERE */}
                <div className="3d-logo">LOGO</div>
            </div>
        </div>
    );
};
```

## Why it works
The `visibility: hidden` property guarantees that the browser does not paint the pixels of the target element during the initial layout/paint cycle. The delay ensures the JS thread and Layout engine are completely done with the heavy lifting of the parent container before introducing the complex children.
