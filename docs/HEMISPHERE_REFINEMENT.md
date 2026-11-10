# Hemisphere and icon refinement

## Design plan

Keep black #000000, graphite #151515, silver #b8c2d2, white #f5f5f5, and ice #abc5ef. Use the existing local system font stack. Place a broad animated hemisphere above the centered headline and compact form. Keep the lower hero open by removing the caption, navigation CTA, and motion control as requested.

The globe uses a dark horizon fade and luminous surface dots. On pointer hover, nearby dots lift and brighten in a travelling wave; rotation accelerates gradually. Filled control glyphs use a compact 16–18 px silhouette. Large illustrations become dimensional silver objects: an instrument dial, stacked transfer tiles, and a sculpted leaf. Hover responses are immediate and distinct: dial sweep, tile separation, leaf lift and orbit.

## Brief review

The broad half-globe is the reference's recognizable composition; a small full sphere no longer fits. Keep the requested black/silver palette rather than the reference's green. Remove redundant controls instead of adding ornament. Fix descender clipping by giving the heading a safe line box and solid text color. Use native smooth anchor scrolling with reduced-motion fallback. Keep offscreen/hidden-tab motion suspension and no new dependencies.

## Verification

- 93 automated tests passed, including the updated reduced-motion/offscreen controls and a new finite-coordinate hover-geometry check.
- Production Worker build, manifest validation, and bundled asset/API integration checks passed. The API/model implementation is unchanged.
- Browser QA confirmed a wide half-globe, an unclipped desktop and mobile heading, removal of all three requested elements, and filled form glyphs. The analyze icon survived a complete fixture-backed audit.
- Smooth anchor navigation was observed reaching the features section; computed scroll behavior was `smooth`. The methodology link opened its native disclosure.
- The tile hover transform was observed in transition. Desktop screenshots confirmed the three new dimensional illustrations. A 360 px test frame had matching 345 px client and scroll widths (scrollbar excluded).
- Continuous globe rendering remains capped at 30 fps and 1.5 pixel density. Hidden tabs, offscreen globe, and reduced motion suspend the frame loop. Reduced-motion scheduling is automated-test coverage, not OS preference emulation.
- The manual motion button was removed at the user's request. System reduced-motion support remains. Hover wave and highlight are decorative; no analysis value is synthesized from them.

| Frontend asset | Minified bytes | Local gzip bytes |
| --- | ---: | ---: |
| HTML and SVG | 14,380 | 4,931 |
| CSS | 14,687 | 4,348 |
| JavaScript | 9,763 | 4,121 |
| Total | 38,830 | 13,400 |

Three frontend resources, no new dependencies or external assets. Local gzip sizes do not guarantee hosting transfer encoding. Animation consumes rendering work; no measured energy or emissions reduction is claimed. Live Google API access remains unverified; UI QA uses the isolated synthetic PageSpeed fixture and real CO2.js calculation.
