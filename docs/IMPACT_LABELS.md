# Recommendation impact and restrained headline gradient

Red means a larger estimated improvement, yellow a moderate improvement, and green a small improvement that can wait. Green is not an audit-pass state. Rank actionable findings by estimated time/data savings, not the audit score. Missing savings must remain unclassified instead of implying a small impact. Show the evidence and explain the app-specific thresholds. Savings may overlap and are not additive or guaranteed.

Keep the current black layout, padded input and globe clearance. Add a static white/silver/ice-blue text gradient only to the hero heading, retaining its padded line box and a readable forced-colors fallback. No new animation or dependency.

Validation: 100 tests pass, including impact thresholds independent of audit score, invalid/missing savings, ordering and related-audit deduplication, passed-check exclusion, and UI counts/reset. Production build, Worker validation, integrated artifact checks and Git whitespace checks pass. Browser QA confirms desktop and 360px gradient/impact labels, descending impact order, and no horizontal overflow. UI QA uses synthetic PageSpeed responses and real CO2.js; live Google access was not verified.
