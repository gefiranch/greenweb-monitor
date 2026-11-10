# PRD review and implementation decisions

Source reviewed: PRD_GreenWeb_Monitor_v1.0.docx, all sections and the technology table.

The MVP scope and API contract are implementable as written. Development follows Phase 1 only: a single-page vanilla frontend, one analysis endpoint, a real Google adapter, explicit CO2.js SWDM v4, actual audit-based recommendations, and simple error/loading states. No history, database, admin, AI, export, comparison, recurring analysis, or hosting verification is added.

| PRD point | Implementation decision |
| --- | --- |
| Node LTS + Express, vanilla frontend | Preserved for local use and ordinary Node hosting. |
| Sites deployment | A small Worker transport shares the backend logic; Sites cannot run a persistent Express listener. Only the deployment bundle needs esbuild. |
| CO2.js SWDM v4 | Pin 0.19.0; explicitly select model `swd`, version `4`, method `perVisit(bytes, false)`. |
| Real transfer units | Require the Lighthouse byte-weight audit with a finite nonnegative integer and numericUnit `byte`; reject incomplete results. |
| PageSpeed API key | Use backend environment only. Google documents anonymous access, so an empty key can attempt anonymous mode; quota/key failures are explicit. |
| Mobile + performance | Both parameters are supplied on every analysis; no retries or extra category requests. |
| Changing audit IDs | Check only findings present in the real response; support selected legacy/new IDs, skip missing/error/passed audits, deduplicate categories, limit to five. |
| URL safety | Normalize and validate URL/IP syntax; never directly fetch the target. Google resolves DNS and follows target redirects. Public-name-to-private-DNS resolution is not performed by this app. |
| Public app / no login | No application auth exists. The initial Sites deployment remains owner-private under platform defaults; public sharing needs an explicit audience change. Ordinary Node hosting can be public. |
| Simple rate limiting | Bounded ephemeral per-client and global counters with concurrency protection. Document per-process/isolate limits. |
| Phase 2 | Stopped at functional MVP styling; no optional features. |

Open acceptance evidence: successful live Google audit with usable quota, public self-audit, mobile Lighthouse performance score, and full WCAG conformance audit. These cannot be inferred from a successful render or mocked tests.
