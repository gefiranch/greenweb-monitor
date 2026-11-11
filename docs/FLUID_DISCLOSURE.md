# Cursor water layer and smooth disclosure

Keep the black foundation and readable opaque panels. Use pale ice-blue ripples behind all content as the cursor moves. Eight reusable CSS surfaces expand, drift and fade through compositor-friendly transforms and opacity; no full-screen simulation, image downloads, continuous timers or render loop. Disable decorative motion for touch/coarse pointers and reduced motion; cancel active effects when hidden.

Hide the document scrollbar visually while retaining native wheel, touch and keyboard scrolling. Preserve native details/summary keyboard semantics and its no-JavaScript fallback. Animate the methodology container height in both directions, reverse from its current rendered height, make closing content inert, and handle reduced motion and viewport changes without leaving stale inline dimensions.

Validation: 106 tests pass, including bounded/throttled ripple allocation, touch/reduced/hidden exclusions, disclosure reversal, keyboard-triggered click handling, focus restoration and cleanup. Production build, integrated Worker artifact checks and whitespace checks pass. Browser QA verified visible cursor ripples behind the hero, hidden document scrollbar, methodology anchor scrolling, and opening/closing via mouse and Enter with natural-height cleanup (64px collapsed, 250px expanded at the tested desktop width).
