# GreenWeb Monitor

A functional implementation of `PRD_GreenWeb_Monitor_v1.0.docx`, with the UI refinement requested on 10 November 2026. Enter one public HTTP/HTTPS URL to request a real mobile PageSpeed audit, read the transfer size, and estimate grams of CO₂e per visit with CO2.js / SWDM v4. The interface uses a small, dark, responsive HTML/CSS/vanilla JavaScript page.

**Current verification limit:** Google rejected the real anonymous PageSpeed request with HTTP 429 (quota exhausted). Successful live PageSpeed → CO2 analysis is therefore still unverified. Configure a valid API key with available quota, then run the live test below. The production UI never substitutes test data.

## 1. Requirements

- Node.js **22.13.0 or newer** (Node LTS recommended).
- npm, Git, and a GitHub account for pushing your own repository.
- Recommended: a Google Cloud project with **PageSpeed Insights API enabled** and an API key with available quota. Anonymous calls are supported by Google but can exhaust shared quota.

## 2. Install and configure

Extract `greenweb-monitor-source.zip` and open a terminal inside `greenweb-monitor`:

```bash
cd greenweb-monitor
npm ci
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Open `.env` in your editor and set:

```dotenv
PAGESPEED_API_KEY=your_google_pagespeed_api_key
PORT=3000
```

Keep the key in `.env` or your deployment's server environment. Never put it in `public/`, browser JavaScript, Git, screenshots, or a URL you share. Restrict the key to the PageSpeed Insights API in Google Cloud. No API key is included in this project.

## 3. Run locally

```bash
npm start
```

Open **http://localhost:3000**. Enter a public domain or URL, such as `example.com` or `https://example.com/`, and choose **Analyze page** or press Enter. A normal submission performs one Google request, with `strategy=mobile` and `category=performance`. There are no automatic retries or background requests.

`npm run dev -- --host 127.0.0.1 --port 4173` also works for preview tooling. The default standalone server binds to `0.0.0.0`.

## 4. Test the implementation

```bash
npm test
npm run build
npm run validate
node scripts/check-artifact.mjs
npm run test:live -- https://example.com/
```

- `npm test`: validation, real carbon model, normalization, audit findings, API errors/timeouts, rate limiting, HTTP integration, and frontend state transitions. Google responses are mocked **only in tests**.
- `npm run build`: bundles the Sites Worker and embeds minified frontend assets. This build is for Sites hosting; the Node/Express server runs directly from source.
- `npm run validate`: verifies the deployment artifact's module and handler.
- `check-artifact.mjs`: exercises the actual bundled Worker using a test-only Google fixture and real CO2.js.
- `test:live`: calls the real Google API. A nonzero exit code means the live integration has not passed; inspect the safe error code.

The first four commands do not require a Google API key. Test fixtures cannot be enabled by a production environment flag.

For academic evaluation, explicitly run three audits against your own **publicly accessible** deployment and use the median transfer bytes:

```bash
npm run evaluate -- https://your-public-deployment.example
```

Replace that example URL with the real URL. This command makes three sequential Google requests only when you run it; normal user analysis still makes one. It prints all runs, their performance scores, findings, median transfer bytes, and the CO₂e estimate calculated from that median. Private Sites access blocks external Lighthouse, so use an explicitly public deployment for this evaluation. No performance score or emissions result has been invented for this app.

## 5. Push this code to GitHub, step by step

Create a new **empty repository** on GitHub named `greenweb-monitor`. Do not initialize it with a README, license, or `.gitignore`, because those files already exist locally. Replace `YOUR_USERNAME` below with your GitHub username.

Run from the extracted `greenweb-monitor` directory:

```bash
# 1. Confirm you are in the project folder.
pwd

# 2. Start a new local repository.
git init

# 3. Use main as the branch name.
git branch -M main

# 4. Confirm the secret file is ignored (when .env exists).
git check-ignore .env

# 5. Stage the source, tests, lockfile, and documentation.
git add .

# 6. Review what will be committed. .env and node_modules must not be listed.
git status

# 7. Commit.
git commit -m "Build GreenWeb Monitor functional MVP"

# 8. Connect the empty GitHub repository.
git remote add origin https://github.com/YOUR_USERNAME/greenweb-monitor.git

# 9. Push.
git push -u origin main
```

GitHub may ask you to authenticate using its normal Git credential manager/browser flow. Do not use an account password as an HTTPS Git password. If Git asks for your name/email, configure the identity you want attached to commits, then rerun `git commit`:

```bash
git config user.name "Your Name"
git config user.email "your-github-email@example.com"
```

For later changes:

```bash
git add .
git diff --cached
git commit -m "Describe your change"
git push
```

If using an **existing** repository, clone it first and copy these source files into it, without a nested `.git` directory. Do not force-push over unrelated history.

The download intentionally contains no `.git` directory, dependencies, build output, `.env`, or deployment archive. It includes the lockfile and the Sites hosting manifest. Pushing to your own GitHub repository does **not** automatically redeploy the existing Sites project. The manifest's project ID identifies the Site created for this task; use the Sites workflow to update that Site. For a different Site, let Sites register a new project identity.

## 6. Deploy

### Node/Express hosting

Use a Node-capable host, not static-only GitHub Pages:

- Install: `npm ci --omit=dev`
- Start: `npm start`
- Set `PAGESPEED_API_KEY` as a server environment variable.
- Let the platform set `PORT` if required.
- Keep the frontend and `/api/analyze` on the same origin. A reverse proxy should preserve the original Host header.

A process manager/reverse proxy can provide TLS and restart the process. Standalone rate limiting is per process and uses the direct client connection address; a proxy may group visitors under its IP unless you add a verified proxy-specific policy.

### Sites hosting

Sites runs Cloudflare Workers rather than a persistent Node/Express process. `worker/index.js` is a small transport adapter around the **same** validation, PageSpeed, carbon, and API code used by Express. `npm run build` bundles that adapter with esbuild. No frontend framework, SSR framework, database, authentication feature, or app integration has been added.

For the hosted Site, set `PAGESPEED_API_KEY` using the Site's runtime environment settings, then redeploy so the environment revision is applied. Your local `.env` is not uploaded. A private Site may display the hosting platform's access gate; the application itself implements no login. Public access was requested in the PRD, but a new Site starts owner-private by default and its audience was preserved.

## 7. Architecture and API

```text
public/                  HTML, native CSS, vanilla browser JavaScript
src/server.js            Node/Express entry point
src/api.js               Shared request handling and ephemeral limits
src/validation.js        Public URL checks
src/pagespeed.js         Fixed Google endpoint, timeout, response normalization
src/carbon.js            Explicit SWDM v4 / CO2.js calculation
src/recommendations.js   Maximum five supported, failing Lighthouse findings
worker/index.js          Sites transport and static assets
scripts/                 Build, artifact checks, live check, academic evaluation
tests/                   Automated tests and isolated fixtures
docs/                    PRD review and verification report
```

One endpoint:

```http
POST /api/analyze
Content-Type: application/json

{"url":"https://example.com/"}
```

Successful response fields: `url`, `analyzedAt`, `strategy`, `performanceScore`, `transferBytes`, `estimatedCO2eGrams`, `carbonModel`, `hostingAssumption`, `recommendations`.

`performanceScore` is 0–100. `transferBytes` comes only from Lighthouse `audits['total-byte-weight'].numericValue` **when `numericUnit` is `byte`**. Missing bytes, units, scores, or timestamps are an error, not an invitation to guess. The UI uses decimal KB/MB (1 KB = 1,000 bytes; 1 MB = 1,000,000 bytes) and displays raw bytes too.

Error shape:

```json
{"error":{"code":"INVALID_URL","message":"A safe, user-readable explanation."}}
```

Errors use 400 for validation, 409 for a duplicate running analysis, 413/415 for request format, 422 for unsupported analysis, 429 for local rate limiting, 502 for upstream/data/calculation failures, 503 for quota/configuration/busy states, and 504 for upstream timeout.

## 8. Carbon method and assumptions

Pinned dependencies: `@tgwf/co2` **0.19.0**, Express **5.1.0**, and `ipaddr.js` **2.2.0**. esbuild **0.25.12** is build-only. Exact transitive versions are recorded in `package-lock.json`.

```js
const model = new co2({ model: 'swd', version: 4 });
const estimatedCO2eGrams = model.perVisit(transferBytes, false);
```

`false` means green hosting is unverified and the model's non-green hosting assumption is used. It does not prove fossil-fuel use. Model defaults, including its visit assumptions, remain unchanged. This is a transfer-based estimate per modelled visit, not a measured energy/actual-emissions figure. Timing, mobile test conditions, cache state, and page contents can affect results. No monthly/yearly extrapolation is made.

References checked during implementation:

- [Google API reference](https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed)
- [Google setup and API-key guidance](https://developers.google.com/speed/docs/insights/v5/get-started)
- [CO2.js estimation models](https://developers.thegreenwebfoundation.org/co2js/models/overview/)
- [CO2.js function documentation](https://developers.thegreenwebfoundation.org/co2js/functions/overview/)
- [CO2.js source and releases](https://github.com/thegreenwebfoundation/co2.js)

## 9. Security, privacy, and limits

- Server checks schemes, credentials, length, malformed hosts, standard ports, private/reserved IPv4 and IPv6 (including IPv4-mapped IPv6), and common internal hostname suffixes. WHATWG URL parsing normalizes obfuscated IPv4 before checking.
- The server never fetches user-supplied URLs. It calls only the fixed Google endpoint. DNS resolution and redirect traversal happen at Google; custom public DNS names that resolve internally cannot be classified from URL syntax alone. There is no direct target-fetch SSRF path in this app.
- One 55-second upstream deadline; browser deadline 65 seconds. No automatic retries or polling.
- Five attempts per client per 10 minutes; 30 total per 10 minutes; four analyses simultaneously; one in-flight request per client. Counters are in memory, bounded, and reset on restart/isolate turnover. They are a simple MVP limit, not a distributed quota guarantee. Workers use the platform-supplied CF-Connecting-IP.
- Request bodies limited to 4 KiB. The API rejects cross-origin browser submissions.
- No URL/result logs, analytics, database, localStorage, cookies, or stored analysis history. Google receives submitted URLs. Hosting providers may retain standard platform request/security logs outside the app's control.
- API responses use `no-store`; security headers and text-only DOM rendering reduce injection risk. No stack traces or upstream secrets are returned.

See [docs/PRD_REVIEW.md](docs/PRD_REVIEW.md) and [docs/TEST_REPORT.md](docs/TEST_REPORT.md) for scope decisions and verification limits. The requested visual refinement is included; optional product features remain outside scope.

## 10. Half-globe hero, clean icons, and smooth navigation

The interface keeps the true black background, graphite panels, silver controls, and restrained icy-blue accents. Navigation, field labels, focus/error states, result cards, methodology, and footer use a consistent spacing and type system. The redundant hero caption, navigation CTA, and motion control have been removed. The heading uses a subtle white–silver–ice-blue gradient and a larger line box to preserve descenders at every viewport size. The navigation remains available on mobile and uses smooth anchor scrolling unless reduced motion is enabled.

The globe uses native Canvas 2D projection in a wide hemisphere composition with a dark horizon fade: idle rotation at 0.14 rad/s (about 45 seconds per revolution), smoothly accelerated hover rotation at 0.38 rad/s (about 17 seconds per revolution) on fine pointers, and continuously travelling dots along connections. Hover adds a gently pulsing, brighter dot response around a smoothed pointer position. A bounded polynomial falloff replaces per-dot trigonometric waves, exponential falloff, and extra glow draws; interaction work is skipped after hover fades. It draws at no more than 30 frames per second and caps pixel density at 1.5. Its animation loop stops when the globe is offscreen, the tab is hidden, or reduced motion is enabled. Reduced motion retains a static globe. Inline SVG remains as the non-canvas fallback. No motion library, external font, image, video, polling, or runtime framework was added.

The form accepts bare domains by adding HTTPS; explicit HTTP/HTTPS is preserved. The clear control removes input. **Stop waiting** aborts the browser request and restores controls; it cannot guarantee that Google or the server stops an already-started audit. The in-flight lock and quota limits still apply. Loading is indeterminate rather than a fabricated progress percentage.

Compact filled glyphs appear in the form and analyze button. The redundant form privacy sentence and example action have been removed. The methodology still explains the Google PageSpeed data flow.

Feature illustrations are inline SVG instruments with restrained silver/ice-blue shading. On hover, the performance dial sweeps its needle, rotates its calibration ring and sequences status lights. Data layers fan apart, rotate through a gentle assembly cycle and carry moving edge signals and packets. The molecular model precesses between two counter-rotating electron orbits with a repeating nucleus ripple. Entry transforms ease over 600 ms; sustained motion uses separate nested groups, so it builds on the entrance smoothly. These loops run only while hovered on a fine pointer, pause in hidden tabs and stay static with reduced motion. No motion library or media assets were added.

The globe keeps its hemisphere and upper clearance. Brighter continental dots, a restrained atmospheric rim, moving connection trails and expanding hub pulses make the network readable. Hover adds a local ripple through the dots and smoothly increases rotation/packet speed. The animation remains limited to 30 fps and DPR 1.5, stops offscreen or in hidden tabs and is static with reduced motion. Native CSS eases buttons, focus rings, card borders and disclosure content. Keyboard-submitted results receive focus immediately.

This preserves the existing backend and carbon calculation. It does not resolve an invalid Google API key, disabled API, or exhausted quota. Your local `.env` remains yours; the source archive contains only `.env.example`.

For manual interface checks without a Google key, use the isolated fixture-only test server:

```bash
node tests/preview-ui.mjs
```

Open **http://127.0.0.1:3001/_qa**. The test page labels its synthetic PageSpeed response and lets you inspect 360 px, 390 px, and 960 px frames. It runs the real CO2.js calculation against that fixture. This helper is never imported by `src/server.js` or `worker/index.js`, and is not a production analysis. Stop it with Ctrl+C.

See [docs/MOLECULE_GLOBE_MOTION.md](docs/MOLECULE_GLOBE_MOTION.md) for the current molecule and globe motion refinement. [docs/FOOTPRINT_MOTION.md](docs/FOOTPRINT_MOTION.md) records the previous footprint revision. [docs/CLEAN_ICON_REFINEMENT.md](docs/CLEAN_ICON_REFINEMENT.md) records the previous flat-icon revision. [docs/HEMISPHERE_REFINEMENT.md](docs/HEMISPHERE_REFINEMENT.md) records the hemisphere work and the previous metallic icon styling. [docs/INTERACTION_REFINEMENT.md](docs/INTERACTION_REFINEMENT.md) records the previous full-globe revision. [docs/BLACK_THEME.md](docs/BLACK_THEME.md) records the earlier static black design. [docs/UI_REFINEMENT.md](docs/UI_REFINEMENT.md) records the earlier forest design and its historical measurements. A language or framework choice alone does not establish environmental impact.


## 11. Recommendation impact

“Where to improve” labels the estimated benefit of fixing each finding, not how badly an audit scored:

- **Red — High impact:** estimated savings of at least 500 ms or 100 KiB.
- **Yellow — Medium impact:** at least 100 ms or 20 KiB, below the high band.
- **Green — Low impact:** smaller reported savings; the improvement can wait.
- **Gray — Impact not estimated:** no valid numeric savings data. Missing data never implies low impact.

These are GreenWeb heuristics, not Google thresholds, guaranteed gains, or carbon-reduction predictions. The higher time/data band wins. Estimates use available `details.overallSavingsBytes`, `details.overallSavingsMs`, and `metricSavings` totalBytes/FCP/LCP values; the maximum valid value for each unit is used, never their sum. Estimates can overlap across recommendations and must not be added together. Page payload alone is not potential savings.

Actionable supported audits have a finite score below 1. Related findings are grouped after impact sorting, retaining the largest estimated opportunity, with up to five recommendations displayed. Within a band, sorting uses the larger of time/500 ms and bytes/100 KiB. Counts refer only to displayed recommendations. Scores of 1 are excluded from recommendations. Invalid, manual, not-applicable and error scores are ignored. `priority` is now `high`, `medium`, `low`, or `unknown`; `impactEvidence` describes the numeric estimate. `passedChecks` remains in the API for compatibility but is not rendered as green improvement advice.

## 12. Hero and form spacing

The globe has more clearance below navigation and its projected routes remain inside the upper canvas edge. The URL form has larger inner padding on both sides, including mobile. The headline has a static, subtle white/silver/ice-blue gradient with a solid fallback for unsupported or forced-color modes; its padded line box preserves descenders. No extra animation or dependencies were added.

Production builds use content-hashed asset revision tags. If replacing an older local copy, copy the entire project (including `src/` and `public/`), restart the Node server, and reload the page. See [docs/IMPACT_LABELS.md](docs/IMPACT_LABELS.md).

## 13. Living network refinement

See [docs/NETWORK_MOTION.md](docs/NETWORK_MOTION.md) for the globe and instrument-card update. The homepage no longer contains the example button or the redundant privacy sentence below the form.

## 14. Water background and smooth disclosure

A subtle water-ripple layer follows cursor movement behind page content. It reuses eight CSS surfaces and animates only transforms/opacity; pointer events are passive and emissions are throttled to one per 180 ms, with each ripple fading after 1.45 seconds. There is no background rendering loop or idle timer. Reduced motion, coarse/touch pointers and hidden tabs disable or cancel the effect. The normal cursor and all content interactions remain available.

The document scrollbar is visually hidden; native wheel, touch and keyboard scrolling are preserved. “How the estimate works” expands and collapses over 420 ms, reverses from its current height on repeated clicks, and retains native details/summary keyboard and no-JavaScript behavior. Content becomes inert during closing; inline dimensions clear on completion, resize or preference change. Methodology links open the section and scroll to its container. See [docs/FLUID_DISCLOSURE.md](docs/FLUID_DISCLOSURE.md).

## Cursor and mobile navigation update

Mobile navigation collapses into an accessible hamburger menu (Escape, outside click, and link selection close it). Desktop uses a dot cursor, a ring for clickable controls, and the same ring + dot in inputs. Sonar waves appear only on background clicks, with no automatic pulses. Effects pause when the tab is hidden or the pointer leaves, and respect reduced motion. The Analyze button shows an hourglass only while a request is running. No animation dependency was added.

Cursor refinement: hide native pointers consistently on all page descendants (including SVGs and input controls). White difference blending gives the custom dot and ring automatic contrast on light surfaces. Sonar waves use stronger opacity and two fine wave fronts while remaining below content.

Analyze button hover: the highlight fades over a stable gradient, with a subtle lift and icon motion. Pointer exit reverses the same transition. Disabled/loading resets the hover transform; reduced motion keeps the control static.

Visual treatment: plain white heading and neutral white Analyze button on the black and silver interface. The custom cursor dot remains 7px. Colored ambient hero gradients have been removed.

## Brand icon and entry reveal

The supplied GreenWeb mark is traced as a small SVG silhouette, used in the navbar and the browser favicon. Each fresh page load or refresh shows the black mark on a white screen briefly, fades it out, and reveals the site through seven white panels sliding up in sequence. The reveal finishes in 2.45 seconds, can be skipped with Escape, and is omitted for reduced motion. The content is inert only during the reveal and is restored by a bounded timeout. CSS also hides the overlay if JavaScript is unavailable. No animation package or external asset request is needed.

The favicon uses a smaller black mark inside a white circle with transparent corners. The entry reveal uses a soft logo entrance and exit, staggered white panels rising, and a subtle content settle.

Background interaction update: a subtle static silver/slate gradient adds depth. Sonar is click-only, ignores form controls and links, and supports rapid repeated clicks through a reusable pool of 12 ripples. No interval or idle animation runs. Reduced motion and hidden tabs suppress the ripples.

Entry choreography: the white panels now lift upward, beginning at 1 second. Navbar, globe, heading, description, and form enter in a short stagger between 1.45 and 1.75 seconds, finishing before the 2.45-second unlock. Entry animations use only transform and opacity and are omitted for reduced motion.
