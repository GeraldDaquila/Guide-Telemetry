# Guide Telemetry — Project Status

**Checkpoint:** 2026-11-19  
**Plugin package:** 0.1.1  
**Repository:** GeraldDaquila/Guide-Telemetry  
**Production status:** untouched by the intended telemetry release; telemetry plugin absent.

## Objective

Measure coarse visitor interaction with The Guide using existing GA4 and Clarity integrations, without collecting visitor-authored content and without altering Guide behavior.

## Protected production components

- Guide page ID: 78833.
- Guide URL: `/the-guide-find-your-way2/`.
- Controller: `guide-controller-v489.326.js` — immutable for this task.
- Woody snippet ID 76926 — do not modify.
- Primary and secondary USE processors, routing, safety, and failover — do not modify.
- Render service `living-archive-gold-star-v2-qa` — unrelated FastAPI QA environment; do not modify.

## Current artifact and tests

Version 0.1.1 local QA package contains:
- WordPress plugin PHP entry point.
- Page-scoped JavaScript event observer.
- JavaScript runtime harness.
- PHP enqueue/consent harness.
- README and QA plan.

Recorded local results:
- Runtime suite: PASS (5 primary groups + 4 privacy/resilience groups).
- PHP enqueue contract: PASS (3 groups).
- PHP syntax: PASS.
- JavaScript syntax: PASS.
- ZIP integrity: PASS.

These are local harness results, not WordPress browser acceptance.

## Consent findings

- WP Consent API is active, but it is a framework rather than a CMP.
- Its source defaults `wp_has_consent()` to true when no consent type is configured. Do not use this alone as affirmative opt-in.
- Site Kit Consent Mode source maps statistics to `analytics_storage` and defaults analytics storage to denied, but actual enabled state and CMP integration were not verified because the read-only REST request returned 401.
- Microsoft Clarity plugin is active. Its inspected script-injection callback has no direct WP Consent API check. Actual project ID and any external CMP blocking remain unverified.
- No production consent or analytics settings were changed.

## WordPress.com and GitHub integration decision

- Life.Understood. is on WordPress.com Premium.
- The WordPress.com Deployments screen is a GitHub-to-production deployment workflow, not an isolated QA environment.
- The dedicated repository exists and is public.
- The GitHub App permission screen offered all repositories or selected repositories. Least-privilege selection was recommended.
- User reached WordPress.com repository setup with `GeraldDaquila/Guide-Telemetry` selected, destination directory `/`, automated deployments OFF, Simple mode selected.
- User was advised to cancel. **Do not save or connect this repository to Life.Understood.** A manual deployment would still target production; it is not staging.
- Repository remains independent source control only.

## Current blocker

No isolated WordPress QA runtime is available yet. WordPress.com Premium does not expose built-in staging in the screens reviewed; the Deployments feature does not provide a staging environment. A separate WordPress QA installation is the recommended path.

## Next actions

1. Populate and maintain this repository as the durable source of truth.
2. Identify a separate WordPress QA host/site, independent of Life.Understood. production.
3. Verify CMP behavior and actual affirmative statistics-consent signal in QA.
4. Install plugin only in QA, run browser acceptance, and document results.
5. Prepare a production release proposal only after all gates pass and user explicitly approves it.

## Absolute no-go list

- No production plugin install, activation, or deployment.
- No WordPress.com GitHub deployment connection to production.
- No modification to Guide controller or Woody snippet 76926.
- No Site Kit, Clarity, or consent configuration changes during discovery.
- No change to processor routing, safety, or failover.
- No database sync from QA/staging to production.
- No modification/redeployment of Render Standalone QA.
