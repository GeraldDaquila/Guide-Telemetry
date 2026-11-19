# QA and acceptance plan

## Automated/static checks

1. PHP syntax check.
2. JavaScript syntax check.
3. Verify enqueue is restricted to page ID 78833.
4. Verify consent defaults to false.
5. Verify no vendor script loader or external endpoint is introduced.
6. Verify prohibited visitor-text fields are not read into event payloads.
7. Verify safety-route suppression and request-token response gating.
8. Verify missing analytics globals and runtime exceptions cannot affect Guide operation.

## Browser integration checks — isolated WordPress required

- Consent unknown: plugin JS not enqueued.
- Consent denied: no GA4 or Clarity custom event emitted.
- Consent granted: event dispatch works only when corresponding vendor global already exists.
- Initial submit: one `guide_question_submit`, keyboard and click paths; no duplicate.
- Empty submit: no event.
- Response: one `guide_response_complete` after controller request token appears.
- Safety route: no response-complete event while safety surface is active.
- Follow-up: one event; no text transmitted.
- Resource click: same-origin pathname only; query and fragment removed; external links ignored.
- Vendor missing or throws: Guide interactions continue normally.
- Telemetry script blocked or fails: Guide interactions continue normally.
- Reset, browser back/forward, mobile layout, repeated requests: no duplicate listeners or visible behavior changes.
- Confirm no interaction with primary/secondary USE routing or failover.

## Current execution record — 2026-11-19

Completed locally:
- PHP lint: PASS.
- JavaScript syntax check: PASS.
- PHP enqueue contract: PASS (3 groups).
- JavaScript runtime/privacy/resilience: PASS (9 groups across the runtime suite).

Not completed:
- Real WordPress staging activation and front-end verification.
- Actual CMP integration verification.
- Consent grant/deny browser tests against the real site analytics configuration.

## Release gates

- Do not install or activate on production.
- Do not connect this repository to the WordPress.com production site's GitHub deployment integration.
- Verify actual CMP and server-side affirmative consent signal before enabling the filter.
- Obtain isolated WordPress staging runtime or separately hosted WordPress QA.
- Run browser acceptance against the real Guide markup/controller in that isolated environment.
- Perform independent code review and explicit production release decision.
- Any future production release must preserve the existing Guide controller, Woody snippet 76926, analytics configuration, processor routing, and safety/failover behavior.

## Infrastructure boundary

The existing Render Standalone QA service is a FastAPI backend for Gold Star v2. It is not a WordPress runtime and must remain untouched for this work. The connected Life.Understood. WordPress installation is single-site; the available Cowboy interface has not exposed an isolated WordPress clone/staging environment.
