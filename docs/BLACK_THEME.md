> Historical static-globe revision. The current interactions and measurements are in INTERACTION_REFINEMENT.md.

# Reference-led black theme, 10 November 2026

## Design plan and review

The owner replaced the earlier forest palette with three visual references: a globe-led black hero, charcoal feature panels, and a silver analyzer/control treatment. The Pinterest short URL could not be fetched; the three attached screenshots supplied enough visual information. Their third-party branding and example business claims are not product content.

- Base palette: black `#000000`, graphite `#111111`, raised graphite `#191919`, white `#f5f5f5`, muted silver `#a6a6a6`, icy blue `#abc5ef` limited to the globe illustration and small highlights.
- Typography: locally available system sans-serif throughout, with a larger, tightly spaced headline matching the references' clean technology aesthetic. No external font download.
- Layout: compact functional navigation; a static hemisphere illustration above a centered headline; an integrated URL input and silver action; real results in charcoal panels; three explanatory panels; existing methodology disclosure.
- Motion: preserve the previous subtle, finite entry and pointer feedback. The decorative globe is static after one short entrance. No animation engine, canvas, WebGL, video, continuously spinning planet, or background polling.
- Review: the explicit reference direction takes precedence over the earlier serif/forest direction. The black surfaces stay neutral; the accent does not tint the page background. Cards explain real capabilities rather than presenting invented analysis or customer statistics.

## Scope and resource decisions

The backend, API contract, URL checks, rate limits, PageSpeed request count, and CO2.js calculation remain unchanged. New visuals are inline SVG and native CSS, with no additional frontend request or production dependency. The image is decorative and is not a geographic dataset or carbon measurement.

The previous under-15-KiB frontend measurement is historical. This revision intentionally spends additional bytes on the requested globe and panel composition; final built asset measurements and verification are recorded below. Asset size is not direct evidence of energy use or an emissions reduction.

## Built asset measurements

Measured from the built Worker's three frontend responses. Gzip uses local Node zlib and is an estimate of compressed payload size, excluding headers, not evidence of live content encoding or actual energy use.

| Asset | Previous bytes | Current bytes | Current gzip bytes |
| --- | ---: | ---: | ---: |
| HTML / inline SVG | 4,478 | 9,536 | 3,573 |
| CSS | 6,746 | 10,676 | 3,392 |
| JavaScript | 3,704 | 3,704 | 1,541 |
| Total | 14,928 | 23,916 | 8,506 |

The added illustration and reference-led panels increase uncompressed frontend bytes by 8988 bytes. JavaScript is unchanged. The current frontend is 23.36 KiB uncompressed and 8.31 KiB in this local gzip check. No emissions reduction is claimed.

## Verification

- 86 automated tests passed, including API errors, timeouts, URL validation, carbon calculation, UI states, keyboard/pointer activation, and background visibility handling.
- Built Worker module, versioned CSS/JS URLs, static responses, and integrated API passed artifact checks using a test-only Google response and real CO2.js.
- The browser inspected the hero, native navigation, feature panels, and result cards. Isolated, explicitly labelled fixture tests covered 360 px, 390 px, and 960 px frames. No horizontal overflow was observed in 345 px and 375 px content viewports; the desktop result layout was visually inspected.
- The header action focused the URL input. Keyboard submission produced results. The Methodology link revealed the native disclosure through a fragment target inside its content.
- All motion remains under the reduced-motion media guard. The globe has one finite entrance; loading motion remains restricted to actual requests and pauses in background tabs. Real browser preference emulation was unavailable.
- Live Google API success, a public mobile Lighthouse self-audit, full WCAG conformance, and direct energy/emissions measurements remain unverified.
- No new production dependency, framework, database, tracking, external font, image file, or extra analysis request was added. Sites access remains private.
