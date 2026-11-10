# Molecule and faster, lighter globe motion

Preserve the black/graphite interface and flat silver icon style. Replace footprints with a compact decorative three-node molecule. Use an initial tilt/expansion response and then a smooth floating sway while hovered. Keep SVG transforms in separate entry and loop groups.

Increase globe idle rotation from 0.055 to 0.14 rad/s and hover from 0.25 to 0.38 rad/s. Ease speed and pointer influence over time; avoid a jump on hover. Replace per-dot trigonometric waves, exponential distance calculations, and extra glow draws with a bounded polynomial falloff and one shared pulse per frame. Skip interaction work once the hover response fades away. Preserve the 30fps draw cap, pixel-density limit, reduced-motion behavior, and offscreen/hidden suspension. No new dependencies.

## Verification

- Browser review: hemisphere still renders and rotates, with hover brightening near the pointer. The molecule has three flat filled nodes, an initial tilt and expansion, then a 4-second sway/floating loop. Computed transforms changed during sustained hover; the loop was removed on mouse leave.
- 93 tests passed, including globe pause/resume, reduced motion, bounded draw cadence, valid hover geometry, and form/API behavior. Production build, ESM validation, integrated artifact checks, and whitespace checks passed.
- The draw limit remains 30 fps, with DPR capped at 1.5. No new dependencies or animation loops were added. The lighter per-dot calculation is a code-level optimization, not a measured device energy/emissions result.
- API checks use synthetic PageSpeed data and real CO2.js; this update does not verify or change the Google API key.
