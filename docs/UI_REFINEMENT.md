# Earlier UI refinement, 10 November 2026

Historical: the owner subsequently requested the reference-led black design in BLACK_THEME.md. Its measurements supersede the totals below.

## Brief and design plan

Refine the existing public-page analyzer into a quieter, more focused tool. Keep the Node/Express server, Sites Worker adapter, vanilla JavaScript, native CSS, real PageSpeed input, and explicit CO2.js SWDM v4 calculation.

The owner chose subtle, refined motion. The motion approach prioritizes Emil-style restraint for this analysis tool and Jakub-style production polish for the occasional opening and result moment.

- Palette: forest `#10241f`, surface `#18352c`, mist `#c9dfcf`, text `#f0f3ec`, secondary text `#b0c3b8`, separators `#385247`.
- Type: system sans-serif for controls and data; a locally available book serif stack for the page title. No font downloads.
- Layout: a compact brand/header, centered title, one analysis surface, one optional methodology disclosure, then real results only after analysis. Results use one grouped data area rather than repeated unrelated cards.
- Distinctive element: the typography and restrained forest surface of the analyzer. The rest supports the URL entry and interpretation of data.
- Motion: a single brief form-surface opening, immediate press feedback on pointer actions, short result/disclosure transitions, and an activity indicator only during a real request. Static text stays immediately readable. Reduced-motion preferences and keyboard use suppress nonessential motion.

## Review before implementation

Removed the original tracked uppercase eyebrow, repeated feature checklist, numbered methodology blocks, and MVP version badge. They repeated the primary explanation or described implementation rather than helping a visitor run an analysis. Kept the privacy statement, model limits, hosting assumption, raw byte unit, and actual audit findings because those affect interpretation.

The two supplied Tailwind files are byte-identical. Their semantic token, state, responsive-layout, and accessibility guidance is applied in native CSS. Adding React, Tailwind tooling, component libraries, an animation package, images, or webfonts is unnecessary for this interface. The supplied combined motion guide contains the create workflow, cookbook, and motion anti-pattern checklist. Its separately referenced companion files were not included and could not be retrieved; only the available guidance is claimed here.

## Resource decisions

A language or framework name alone does not establish environmental impact. This refinement reduces avoidable interface work and measures the delivered assets. It adds no production dependency, polling, analytics, image/video, remote font, persistent history, or extra analysis request. Motion is finite or tied to genuine request activity, uses transform/opacity, and stops when inactive or hidden. No direct energy or emissions reduction is claimed without measurement.

## Measured frontend asset comparison

Measured by reading the built Worker's responses for `/`, `/styles.css`, and `/app.js`; gzip sizes use Node zlib locally and exclude HTTP headers. These are asset-byte measurements, not measured page energy, actual network encoding, or a Lighthouse score.

| Asset | Before bytes | After bytes | Before gzip bytes | After gzip bytes |
| --- | ---: | ---: | ---: | ---: |
| HTML | 5,409 | 4,478 | 2,062 | 1,909 |
| CSS | 5,869 | 6,746 | 1,908 | 2,326 |
| JavaScript | 3,356 | 3,704 | 1,448 | 1,541 |
| Total | 14,634 | 14,928 | 5,418 | 5,776 |

The refinement adds 294 uncompressed bytes (2.0%) and 358 locally gzipped bytes (6.6%). HTML becomes smaller; responsive styling, motion guards, and interaction-state handling add CSS/JS. The result stays below 15 KiB uncompressed and 6 KiB in this gzip check. Three initial frontend resources are retained. No emissions reduction is inferred from this comparison.

## Verification

- 86 automated tests passed: existing validation, normalization, carbon, upstream errors/timeouts, rate limits, HTTP integration, and frontend state behavior; new coverage checks pointer versus keyboard activation and background visibility.
- Built Worker module and static assets passed artifact checks with a test-only Google fixture and real CO2.js. The production entry points do not import the fixture preview.
- Browser inspected the initial interface, results, a keyboard-triggered reanalysis, and the native methodology disclosure. A clearly labelled fixture-only parent page provided 360 px, 390 px, and 960 px frames. No horizontal overflow was observed, including when scrollbars narrowed their content viewports to 345 px, 375 px, and 945 px.
- Motion uses transform/opacity only. The only loop is the active-request indicator; it is hidden when idle and paused in a hidden tab. All motion is enclosed by the reduced-motion media guard. A real browser preference override was not available, so the reduced-motion path was reviewed in source rather than claimed as emulated.
- No API key was provided to this environment. Successful live Google analysis, the application's own mobile Lighthouse score, and direct energy/emissions measurement remain unverified. The existing quota/key issue is independent of this visual change.

## Kept out of scope

No theme switch, export, comparison, history, tracking, auto-audits, database, login feature, or hosting-verification feature was added. Private Sites access is preserved.


Browser testing also caught cached-asset mismatch during an update. The build now fingerprints CSS/JS URLs by content, while the Node server revalidates static files using ETags. This avoids mixing an updated document with stale interface code. The carbon calculation and network-analysis behavior are unchanged; only assumption wording was simplified.
