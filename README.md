# Living Archive — Guide Telemetry

**Version:** 0.1.1  
**Status:** QA package prepared; WordPress browser acceptance blocked pending isolated WordPress QA.

A standalone WordPress plugin for privacy-preserving, page-scoped interaction telemetry on The Guide only.

- Production Guide URL: https://geralddaquila.com/the-guide-find-your-way2/
- WordPress page ID: `78833`
- Protected controller: `guide-controller-v489.326.js` — must not be modified.
- Protected Woody Code Snippets ID: `76926` — must not be modified.

## Safety contract

- No production installation, activation, deployment, or WordPress.com repository connection is authorized by this project baseline.
- Does not load GA4, Google Tag Manager, Microsoft Clarity, or any other vendor script.
- Calls only already-present `window.gtag` and `window.clarity` globals.
- Does not read, retain, hash, or transmit question text, follow-up text, generated answers, personal details, safety content, provider/model details, or query-string values.
- Same-origin resource clicks record pathname only.
- Server-side consent filter defaults to **false**.
- Does not modify Guide controller, forms, response rendering, or request/failover path.

## Repository layout

- `plugin/guide-telemetry/guide-telemetry.php` — WordPress plugin entry point.
- `plugin/guide-telemetry/assets/guide-telemetry.js` — isolated event observer.
- `tests/runtime.test.cjs` — JavaScript behavior/privacy/resilience harness.
- `tests/php-enqueue.test.php` — PHP page-scope and consent enqueue harness.
- `QA-PLAN.md` — required acceptance plan and release gates.
- `PROJECT-STATUS.md` — durable project state and operational constraints.

## Consent integration — unresolved release blocker

The site's actual CMP and affirmative statistics-consent signal have not been verified. **Do not connect the filter or enable telemetry until the actual CMP integration is inspected and proven.**

WP Consent API is a framework, not a CMP. Its `wp_has_consent('statistics')` behavior defaults to true when no consent type is set. Therefore, that function alone is not sufficient evidence of affirmative opt-in. The PHP filter `la_guide_telemetry_consent_granted` remains the authoritative fail-closed gate.

The example below is illustrative only and must not be deployed as a blanket grant:

```php
add_filter('la_guide_telemetry_consent_granted', function ($granted) {
    // Replace only with a verified CMP affirmative-statistics-consent check.
    return $granted === true;
});
```

## Events

- `guide_question_submit` — records only coarse `interaction=initial`.
- `guide_response_complete` — requires a controller-issued request token; suppressed during safety surface.
- `guide_followup_submit` — records event name only; no follow-up text.
- `guide_resource_click` — same-origin pathname only; no query or fragment.

GA4 page views remain the responsibility of existing Site Kit/GA4 configuration. Clarity is not initialized by this plugin.

## Local QA

Run from repository root:

```sh
node tests/runtime.test.cjs
php -d zend.assertions=1 -d assert.exception=1 tests/php-enqueue.test.php
php -l plugin/guide-telemetry/guide-telemetry.php
node --check plugin/guide-telemetry/assets/guide-telemetry.js
```

These harness checks do not replace WordPress staging/browser acceptance.

## Deployment policy

WordPress.com GitHub integration must **not** be connected to the production site for this project. The repository is source control and audit history only until a separate isolated WordPress QA runtime exists and passes acceptance. No deployment directory or manual deployment to production is approved.

See [QA-PLAN.md](QA-PLAN.md) and [PROJECT-STATUS.md](PROJECT-STATUS.md).
