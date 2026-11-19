(function (window, document) {
  'use strict';

  var config = window.LAGuideTelemetryConfig || {};
  if (config.consentGranted !== true || Number(config.pageId) !== 78833) return;
  if (window.__LA_GUIDE_TELEMETRY_V1__) return;
  window.__LA_GUIDE_TELEMETRY_V1__ = true;

  var root = document.querySelector('.archive-stage-wrapper[data-guide-instance="woody"]');
  if (!root) return;

  var schemaVersion = String(config.schemaVersion || '1');
  var pendingMainSubmit = false;
  var lastResponseToken = '';
  var lastResponseSignature = '';
  var lastEventAt = Object.create(null);

  function statisticsConsentStillGranted() {
    // Re-check when the standard WP Consent API is present. The PHP-side
    // integration remains the authoritative fail-closed gate.
    if (typeof window.wp_has_consent === 'function') {
      try { return window.wp_has_consent('statistics') === true; }
      catch (e) { return false; }
    }
    return true;
  }

  function emit(name, extra) {
    if (!statisticsConsentStillGranted()) return;
    var params = Object.assign({
      page_id: 78833,
      event_schema_version: schemaVersion
    }, extra || {});

    // Only use already-installed vendor globals. Never inject duplicate tags.
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params);
      }
    } catch (e) { /* Analytics must never affect Guide operation. */ }

    try {
      if (typeof window.clarity === 'function') {
        window.clarity('event', name);
      }
    } catch (e) { /* Analytics must never affect Guide operation. */ }
  }

  function throttled(name, interval) {
    var now = Date.now();
    if (lastEventAt[name] && now - lastEventAt[name] < interval) return false;
    lastEventAt[name] = now;
    return true;
  }

  function safetySurfaceActive() {
    var panel = root.querySelector('#archive-safety-followup');
    if (root.classList.contains('archive-safety-active')) return true;
    if (!panel) return false;
    var style = window.getComputedStyle ? window.getComputedStyle(panel) : null;
    return !!(style && style.display !== 'none' && style.visibility !== 'hidden');
  }

  function hasNonEmptyQuestion() {
    var input = root.querySelector('#archive-query-input');
    // Inspect only whether text exists. Never read, retain, hash, or transmit it.
    return !!(input && typeof input.value === 'string' && input.value.trim().length > 0);
  }

  function onClick(event) {
    var target = event.target && event.target.closest ? event.target.closest('button, a') : null;
    if (!target || !root.contains(target)) return;

    if (target.id === 'archive-submit-btn' && hasNonEmptyQuestion()) {
      if (!pendingMainSubmit && throttled('guide_question_submit', 800)) {
        pendingMainSubmit = true;
        emit('guide_question_submit', { interaction: 'initial' });
      }
      return;
    }

    if (target.matches('a[href]')) {
      if (safetySurfaceActive()) return;
      var href;
      try { href = new URL(target.href, window.location.href); }
      catch (e) { return; }
      if (href.origin !== window.location.origin) return;
      // Store only the same-origin pathname; discard query, fragment and text.
      var resourcePath = href.pathname.slice(0, 180);
      if (throttled('guide_resource_click:' + resourcePath, 500)) {
        emit('guide_resource_click', { resource_path: resourcePath });
      }
    }
  }

  function onSubmit(event) {
    var form = event.target;
    if (!form || !root.contains(form)) return;
    if (form.querySelector('#archive-ordinary-followup-input') && throttled('guide_followup_submit', 800)) {
      emit('guide_followup_submit');
    }
    if (form.id === 'archive-search-form' && hasNonEmptyQuestion() && !pendingMainSubmit) {
      pendingMainSubmit = true;
      emit('guide_question_submit', { interaction: 'initial' });
    }
  }

  function inspectResponse() {
    var response = root.querySelector('#archive-response-text');
    var submit = root.querySelector('#archive-submit-btn');
    if (!response) return;

    var token = response.dataset ? String(response.dataset.guideRequestToken || '') : '';
    if (token && token !== lastResponseToken) {
      lastResponseToken = token;
      pendingMainSubmit = false;
      if (!safetySurfaceActive()) {
        emit('guide_response_complete', { response_status: 'rendered' });
      }
      return;
    }

    // A response box becoming visible without a request token is deliberately
    // not treated as a successful response: it may be a safety or error route.
    if (submit && submit.disabled === false && pendingMainSubmit && !safetySurfaceActive()) {
      var signature = response.childElementCount + ':' + response.textContent.length;
      if (signature !== lastResponseSignature && signature !== '0:0') {
        lastResponseSignature = signature;
        pendingMainSubmit = false;
      }
    }
  }

  document.addEventListener('click', onClick, true);
  document.addEventListener('submit', onSubmit, true);

  var observer = new MutationObserver(function () {
    try { inspectResponse(); } catch (e) { /* no-op by design */ }
  });
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'aria-busy', 'class', 'style', 'data-guide-request-token'] });

  // Initial page view is left to the existing GA4 configuration. This module
  // reports Guide-specific interactions only.
})(window, document);
