# Plain feature icons with sustained hover motion

Keep the existing black (#000000), graphite (#121212), silver (#c1cad8), muted slate (#46505f), and ice (#abc5ef) palette and system typography. Scope this refinement to the three feature cards. Use flat filled shapes, no metallic gradients, floor shadows, sparkle particles, or decorative orbit. Keep the dial, layers, and leaf recognizable with consistent visual weight.

Use two motion stages: a brief 400–500 ms hover response, followed by a slower 3.6–4.6 second low-amplitude loop while hover continues. Separate entry and idle transforms in nested SVG groups. Disable decorative motion for reduced-motion preferences, restrict hover loops to fine pointers, and pause in hidden tabs. Preserve the hemisphere, form, navigation, and backend.

## Verification

- Browser desktop review: flat silhouettes and consistent card spacing. The dial, layers, and leaf each respond on entry and continue changing transform at their respective slow loop cadence while hovered; leaving a card removes its loop.
- Browser 360 px review: cards stack vertically and the page has no horizontal overflow.
- 93 existing tests passed; production build, ESM validation, integrated artifact checks, and whitespace checks passed. API checks use a synthetic PageSpeed fixture with the real CO2.js calculation; no successful external Google API request is claimed.
- Embedded frontend: 36,022 bytes minified, 12,610 bytes gzip across HTML, CSS, and JavaScript (previous revision: 38,830 / 13,400). No dependencies added. File-size reduction is not a measured energy or emissions reduction.
- Hover loops are gated by reduced-motion and fine-pointer media queries. The existing visibility attribute pauses them in hidden tabs. No JavaScript animation loop was added for these icons.
