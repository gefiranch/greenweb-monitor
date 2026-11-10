> Historical full-globe revision. Current design and verification: HEMISPHERE_REFINEMENT.md.

# Interaction refinement

## Design plan

Preserve the requested black and silver direction: black #000000, graphite #151515, elevated charcoal #222222, white #f5f5f5, muted silver #a6a6a6, and ice #abc5ef. Keep the existing system-font stack and generous central hero. Use the globe as the only continuous decorative movement; surrounding controls respond quietly to interaction. Keep explanatory sections centered, and form fields/results left aligned.

The hero globe gains a true projected rotation, surface dots, and moving connections. Speed eases from idle to hover without restarting its angle. A visible motion control, reduced-motion support, offscreen suspension, and hidden-tab suspension limit unnecessary work. Native canvas and SVG avoid a 3D library or external assets.

Form improvements: accept bare public domains by adding HTTPS, show the normalized URL, clear filled input, fill an example without making a request, cancel waiting, and preserve editable input after failure. Keep real API results and model disclosures. Refine icons into consistent silver and ice line illustrations; avoid decorative fake metrics.

## Review against the brief

The black palette and rounded panels are retained because the user explicitly selected these references. The globe is the distinctive centerpiece. No new marketing sections, repeated entrance animations, external fonts, or animation dependency. Animation is not claimed to reduce energy use: continuous motion adds work relative to the prior static version.

## Implementation and verification

- Idle speed: 0.055 radians/second; fine-pointer hover speed: 0.25 radians/second. Exponential easing interpolates speed without resetting the globe angle. Routes loop independently.
- Canvas uses precomputed surface points and route geometry. Drawing is capped at 30 fps, with device pixel ratio capped at 1.5. Offscreen, hidden-tab, manual-pause, and reduced-motion states cancel frame callbacks. Visibility restoration resets timing rather than advancing through missed frames.
- No new dependency and no new frontend request. The existing three-resource delivery and content-hashed asset URLs remain.
- Form accepts bare domains, preserves explicit schemes, rejects other schemes, supports clear/example controls, prevents duplicate submissions, and restores controls after stopping the browser request. Stopping waiting cannot promise server/Google cancellation; the interface and README disclose this limitation.
- `npm test`: 92 tests passed, including new form interactions, abort recovery, reduced motion, drawing cadence, and animation suspension tests. Reduced-motion and hidden-tab scheduling were tested in a simulated browser environment, not OS preference emulation.
- `npm run build`, `npm run validate`, and the built-Worker artifact checks passed. Google fixture data is isolated to tests, with the actual CO2.js model used.
- Browser QA: desktop hero and feature/result panels; 390 px and 360 px test frames; input validation, example fill, pause/play, stop waiting, keyboard reanalysis, and result focus. The 360 px frame had a 345 px content viewport (scrollbar excluded) and 345 px scroll width in both validation and results states: no horizontal overflow.
- Browser globe rendering and pointer interaction checked. Browser extension metadata errors were present in the console; no application error was surfaced during these flows.

### Measured frontend resources

| Asset | Minified bytes | Local gzip bytes |
| --- | ---: | ---: |
| HTML, including fallback and icons | 11,501 | 4,140 |
| CSS | 14,839 | 4,405 |
| JavaScript, including canvas | 9,659 | 4,008 |
| Total | 35,999 | 12,553 |

Gzip measurements are local estimates, not a claim about the hosting provider's exact transfer encoding. The prior static black UI was 23,916 minified bytes. This requested animation increases payload and ongoing rendering work; no measured energy or emissions reduction is claimed. No external PageSpeed success or real Lighthouse performance score was measured in this revision. The earlier API access/quota issue remains an operator configuration concern.
