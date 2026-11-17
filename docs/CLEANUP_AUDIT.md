# Final production cleanup audit

Date: 18 November 2026  
Target runtime: **Vercel Express**, not Cloudflare/Sites.  
Scope: remove provably unused code without removing active webpage features.

## Removed

- Cloudflare/Sites adapter (`worker/index.js`), host metadata
  (`.openai/hosting.json`), and build/Worker artifact scripts.
- `esbuild` build-only dependency and its `@esbuild/*` optional packages from
  the npm lockfile; these were not used in the Vercel runtime.
- `fix-vercel-express.patch` because the Express default-export fix is already
  present in `src/server.js`.
- Unreferenced `planet-arrive` CSS keyframe.
- API `passedChecks` field and its generator/test expectations: the UI never
  rendered it; actionable failed audits still produce recommendations.

## Preserved

- `public/index.html`, `public/app.js`, `public/styles.css`, favicon, dark UI,
  globe, reduced-motion behavior, navigation, form, loading/error states.
- `src/server.js`, `src/api.js`, validation, PageSpeed integration, carbon
  model, audit recommendations, rate-limit/error handling, Vercel config.
- `scripts/live-check.mjs` and `scripts/evaluate.mjs` for legitimate live
  carbon measurement and final SIB reporting.
- Automated tests, isolated UI preview, PRD notes, historical test report,
  and previous design documentation (retained as development evidence).
- `package-lock.json` for reproducible installs.

## Post-change validation checklist

- [ ] `npm ci` completes successfully from the updated lockfile.
- [ ] `npm test` passes.
- [ ] `node --check public/app.js` and `node --check src/server.js` pass.
- [ ] The form, analysis, cancellation, and result display work locally.
- [ ] Pull-request CI passes on GitHub Actions.
- [ ] Vercel preview serves homepage and static assets.
- [ ] `POST /api/analyze` performs a **real** PageSpeed run with valid quota.
- [ ] Mobile layout and accessibility/reduced-motion behavior are rechecked.
- [ ] Live carbon evaluation of GreenWeb Monitor is recorded for the report.

Do not claim live API success, deployment success or post-cleanup test success
before these checks actually pass. Earlier `docs/TEST_REPORT.md` includes
historical Worker-build verifications for an architecture no longer used.

## Change rationale

This cleanup reduces repository complexity, build-only dependency count, and
maintenance surface. It does **not** by itself prove a reduction in the
browser's bytes transferred, measured energy, or CO2e. Those require before/
after measurement under comparable conditions.
