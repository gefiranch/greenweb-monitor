# GreenWeb Monitor

GreenWeb Monitor is a lightweight, single-page web application for checking a
public website's **mobile performance**, **transferred bytes**, and **estimated
CO2e per modeled visit**. It uses actual Google PageSpeed Insights/Lighthouse
audit data and the Green Web Foundation's CO2.js model (SWDM v4). Results also
include up to five evidence-based improvement recommendations.

## Stack and scope

- Browser: semantic HTML, CSS and vanilla JavaScript; no client framework.
- Server: Node.js 22.13+ and Express 5.1; Vercel Express deployment.
- Audit: Google PageSpeed Insights API, `strategy=mobile`, performance category.
- Carbon model: `@tgwf/co2` 0.19.0, SWDM version 4.
- No app login, database, analytics SDK, stored URL/history, or background polling.

Production runtime code is `public/` and `src/`, with `vercel.json` and
`package.json`. `scripts/live-check.mjs`, `scripts/evaluate.mjs`, and `tests/`
are kept to verify functionality and collect academic evaluation evidence.
The previous Cloudflare/Sites Worker and its build tooling were removed
because this repository now targets Vercel only.

## Local setup

```bash
npm ci
cp .env.example .env
# Optionally set PAGESPEED_API_KEY in .env (recommended for quota reliability)
npm start
```

Open http://localhost:3000 and enter a public HTTP/HTTPS URL or bare domain.
The server supplies HTTPS for bare domains via the browser form; the API itself
requires a valid absolute HTTP/HTTPS URL.

**Never commit a real API key.** Set `PAGESPEED_API_KEY` in `.env` locally and
in Vercel project environment settings for production. Enable the PageSpeed
Insights API for the key in Google Cloud and restrict its API access. An
anonymous Google request may fail when quota is exhausted; the app does not
fabricate audit or carbon results to hide errors.

## Deploy to Vercel

1. Import this GitHub repository as an **Express** project.
2. Use `src/server.js` as the Express entry module; it default-exports `app`.
3. Set `PAGESPEED_API_KEY` in server-side project environment variables.
4. Keep the Vercel Express preset output-directory defaults. Do not set a
   custom `dist` output directory or Cloudflare Worker entry.
5. Deploy and verify the homepage and a real `/api/analyze` request.

The project is not a static-only site: analysis requires the server endpoint.

## What happens during an analysis

```text
Browser URL form
    -> POST /api/analyze (URL validation + bounded rate limiting)
    -> fixed Google PageSpeed endpoint (mobile + performance)
    -> verified Lighthouse performance score and total-byte-weight (bytes)
    -> CO2.js SWDM v4 perVisit(transferBytes, false)
    -> score, transfer size, modeled CO2e, up to 5 audit recommendations
```

The API response includes `url`, `analyzedAt`, `strategy`,
`performanceScore` (0–100), `transferBytes` (bytes),
`estimatedCO2eGrams`, `carbonModel`, `hostingAssumption`, and
`recommendations`. Unsupported or incomplete Google data is rejected.

The `false` argument uses the model's *unverified/non-green hosting*
assumption; it is **not evidence that the host uses fossil electricity**.
Output is an **estimate**, not measured electricity or physical emissions.
The API never directly fetches the user-provided URL. Google resolves and
requests the page; submitted URLs are therefore shared with Google.

## Verify and evaluate

```bash
npm test
node --check public/app.js
node --check src/server.js
npm run test:live -- https://example.com/
npm run evaluate -- https://YOUR-PUBLIC-DEPLOYMENT-URL/
```

`npm test` runs local tests with mocked upstream fixtures for stable failure
coverage, but real CO2.js calculations. The live test requires Google API
access with usable quota. The academic `evaluate` command requests three
sequential real audits and summarizes their median transfer bytes.

Do **not** use fixture results as evidence of this website's actual footprint.
For the SIB final report, measure the publicly deployed GreenWeb Monitor itself,
record the PageSpeed/Lighthouse outputs, methodology, dates, transfer bytes,
and valid comparisons. A lower carbon footprint or a Lighthouse score of at
least 90 is a target until independently measured; it is not claimed here.

## Design and safeguards

The dark interface uses inline SVG, a Canvas globe, navigation, accessible
form states, and optional decorative motion. Heavy motion pauses when hidden,
offscreen, or reduced-motion preferences apply. No external font, video, image
framework, or frontend runtime dependency is fetched.

URL validation rejects internal/private IP forms and unsafe URL schemes;
request sizes, concurrency and API attempt rates are bounded in memory. Browser
responses are not cached, and this application stores no result history.
In-memory limits are **not distributed quotas** across Vercel instances.

## Documentation

- [PRD implementation decisions](docs/PRD_REVIEW.md)
- [Historical test report](docs/TEST_REPORT.md)
- [Final cleanup audit](docs/CLEANUP_AUDIT.md)
- `docs/` also keeps historical UI iterations as development evidence.

This project is for the **Sistem Informasi Berkelanjutan** course.
