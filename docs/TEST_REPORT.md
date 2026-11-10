# Phase 1 verification report

Date: 6 November 2026.

## Executed checks

| Check | Observed result |
| --- | --- |
| Node test runner | 84 tests passed, 0 failed. |
| URL validation | Public HTTP/HTTPS, Unicode domains, public IPv4/IPv6 accepted. Local/private/reserved IPs, mapped/obfuscated loopback, internal names, credentials, unsafe schemes, malformed hosts, nonstandard ports, oversized URL rejected. |
| Carbon | Real @tgwf/co2 0.19.0, explicit SWDM v4, perVisit(bytes, false). 1,000,000 bytes produced 0.1482 g CO₂e in the pinned library. Invalid numeric input rejected. This value is a model regression check, not a website analysis result. |
| Google adapter | Request parameters, single call, upstream HTTP errors, malformed/incomplete data, network error, timeout/abort covered with separate fixtures/mocks. |
| Shared API | Success, recovery, quota error, validation before upstream request, 4 KiB body limit, media/method/origin checks, rate-limit reset, duplicate protection, calculation failure verified. |
| Node/Express HTTP integration | Actual local HTTP requests served page and connected endpoint; real CO2 calculation used a test-only Google fixture. |
| Frontend script | Actual app.js run in a small DOM harness: invalid input, loading/disabled states, duplicate prevention, results rendering, no-findings state, retry after error, text-only upstream rendering passed. |
| Deployment build | esbuild Worker bundle generated successfully; module and fetch handler validation passed. |
| Bundled Worker | Static HTML/CSS/JS and integrated analysis response exercised with a test-only Google fixture and real CO2.js. |
| Browser, actual running app | Initial result area hidden; empty input error; private IP server rejection; Enter submission; loading/disabled controls; actual Google quota error; controls recover without refresh. |
| Desktop layout | Browser screenshot inspected; readable dark layout and desktop viewport had equal content/viewport width (no horizontal overflow). |

## Real external API attempt

A real `runPagespeed` request for `https://example.com/`, `strategy=mobile`, `category=performance`, without a key, reached Google and returned **HTTP 429 RESOURCE_EXHAUSTED**, reporting anonymous/shared quota exhaustion. The actual browser request produced the app's clear quota message and no fabricated dashboard values.

No successful real external PageSpeed analysis was obtained. A valid operator API key with available quota is still needed to verify that path. No credentials were supplied or included in the source.

## Still unverified

- Successful real Google audit followed by carbon calculation for that live audit.
- Analysis of this application through external mobile Lighthouse; score >=90 remains a target, not an achieved result.
- Three-run median evaluation against a publicly accessible deployment.
- Physical/mobile-browser viewport rendering and a complete WCAG 2.2 AA audit. Responsive CSS and semantic/accessibility behavior are implemented; this is not a conformance claim.
- Distributed rate limiting: the MVP intentionally uses per-process/isolate memory only.

The hosting platform's initial access is owner-private. Public anonymous accessibility and an external self-audit require an explicit audience change or a public Node deployment. Phase 2 work has not been started.

## UI refinement update, 10 November 2026

The original Phase 1 results above are historical. The later owner-requested refinement is documented in UI_REFINEMENT.md. Current automated checks pass 86 tests, including pointer/keyboard result activation and page-visibility handling. The deployment bundle and isolated UI fixture preview are checked separately. Live external API success and the application's own Lighthouse score remain unverified.

## Reference-led black UI update, 10 November 2026

The owner replaced the forest design with the supplied black/silver/globe references. See BLACK_THEME.md for current frontend measurements and verification. The existing API configuration limitation is unchanged.
