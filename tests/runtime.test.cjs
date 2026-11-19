const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync(__dirname + '/../plugin/guide-telemetry/assets/guide-telemetry.js', 'utf8');

function makeEnv(consent = true) {
  const emitted = [];
  const listeners = {};
  let observer;
  const input = { value: '' };
  const button = { disabled: false };
  const response = { dataset: {}, childElementCount: 1, textContent: 'A response' };
  const safetyPanel = {};
  const root = {
    classList: { contains: () => false },
    contains: () => true,
    querySelector(selector) {
      return ({
        '#archive-query-input': input,
        '#archive-submit-btn': button,
        '#archive-response-text': response,
        '#archive-safety-followup': safetyPanel
      })[selector] || null;
    }
  };
  const document = {
    querySelector: () => root,
    addEventListener: (name, fn) => { listeners[name] = fn; }
  };
  class MutationObserver {
    constructor(fn) { observer = fn; }
    observe() {}
  }
  const window = {
    LAGuideTelemetryConfig: { pageId: 78833, schemaVersion: '1', consentGranted: true },
    location: { href: 'https://geralddaquila.com/the-guide-find-your-way2/', origin: 'https://geralddaquila.com' },
    URL,
    wp_has_consent: () => consent,
    getComputedStyle: () => ({ display: 'none', visibility: 'visible' }),
    gtag: (...args) => emitted.push({ vendor: 'ga4', args }),
    clarity: (...args) => emitted.push({ vendor: 'clarity', args })
  };
  vm.runInNewContext(source, { window, document, MutationObserver, URL, Date, Object, Number, String });
  return { emitted, listeners, input, button, response, root, window, notify: () => observer() };
}

// Consent granted: initial submit logs only coarse metadata, never the question.
{
  const e = makeEnv(true);
  e.input.value = 'A private question that must never leave the browser';
  e.listeners.click({ target: { id: 'archive-submit-btn', closest() { return this; }, matches() { return false; } } });
  const ga = e.emitted.find(x => x.vendor === 'ga4' && x.args[1] === 'guide_question_submit');
  assert(ga, 'initial submission event emitted');
  assert(!JSON.stringify(ga).includes('private question'), 'question text excluded');
  assert.deepStrictEqual(Object.keys(ga.args[2]).sort(), ['event_schema_version', 'interaction', 'page_id'].sort());
}

// Empty submission is ignored.
{
  const e = makeEnv(true);
  e.listeners.click({ target: { id: 'archive-submit-btn', closest() { return this; }, matches() { return false; } } });
  assert.strictEqual(e.emitted.length, 0);
}

// Response-complete requires the controller's request token.
{
  const e = makeEnv(true);
  e.response.dataset.guideRequestToken = '42';
  e.notify();
  assert(e.emitted.some(x => x.vendor === 'ga4' && x.args[1] === 'guide_response_complete'));
}

// Same-origin resource links emit pathname only; external links are ignored.
{
  const e = makeEnv(true);
  const link = { href: 'https://geralddaquila.com/path/resource?secret=1#private', closest() { return this; }, matches() { return true; } };
  e.listeners.click({ target: link });
  const event = e.emitted.find(x => x.vendor === 'ga4' && x.args[1] === 'guide_resource_click');
  assert(event);
  assert.strictEqual(event.args[2].resource_path, '/path/resource');
  assert(!JSON.stringify(event).includes('secret'));
  const ext = { href: 'https://example.org/out', closest() { return this; }, matches() { return true; } };
  e.listeners.click({ target: ext });
  assert.strictEqual(e.emitted.filter(x => x.vendor === 'ga4' && x.args[1] === 'guide_resource_click').length, 1);
}

// Denied consent blocks all emissions.
{
  const e = makeEnv(false);
  e.input.value = 'nonempty';
  e.listeners.click({ target: { id: 'archive-submit-btn', closest() { return this; }, matches() { return false; } } });
  assert.strictEqual(e.emitted.length, 0);
}

console.log('PASS: 5 runtime QA groups');

// Duplicate click/submit paths are coalesced by the pending guard + throttle.
{
  const e = makeEnv(true);
  e.input.value = 'nonempty';
  const button = { id: 'archive-submit-btn', closest() { return this; }, matches() { return false; } };
  e.listeners.click({ target: button });
  e.listeners.click({ target: button });
  e.listeners.submit({ target: { id: 'archive-search-form', querySelector: () => null } });
  assert.strictEqual(e.emitted.filter(x => x.vendor === 'ga4' && x.args[1] === 'guide_question_submit').length, 1);
}

// Safety-active state suppresses resource click tracking.
{
  const e = makeEnv(true);
  e.root.classList.contains = (name) => name === 'archive-safety-active';
  const link = { href: 'https://geralddaquila.com/safety-resource/', closest() { return this; }, matches() { return true; } };
  e.listeners.click({ target: link });
  assert.strictEqual(e.emitted.length, 0);
}

// Consent API errors fail closed.
{
  const e = makeEnv(true);
  e.window.wp_has_consent = () => { throw new Error('consent unavailable'); };
  e.input.value = 'nonempty';
  e.listeners.click({ target: { id: 'archive-submit-btn', closest() { return this; }, matches() { return false; } } });
  assert.strictEqual(e.emitted.length, 0);
}

// Missing vendor globals are harmless; no analytics script is injected.
{
  const e = makeEnv(true);
  delete e.window.gtag;
  delete e.window.clarity;
  e.input.value = 'nonempty';
  e.listeners.click({ target: { id: 'archive-submit-btn', closest() { return this; }, matches() { return false; } } });
  assert.strictEqual(e.emitted.length, 0);
  assert.strictEqual(e.window.__LA_GUIDE_TELEMETRY_V1__, true);
}

console.log('PASS: additional privacy and resilience QA groups (4)');
