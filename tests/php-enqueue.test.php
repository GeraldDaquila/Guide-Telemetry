<?php
// Minimal isolated WordPress hook stubs for the telemetry plugin's enqueue contract.
define('ABSPATH', __DIR__);
$GLOBALS['hooks'] = array();
$GLOBALS['enqueued'] = array();
$GLOBALS['localized'] = array();
$GLOBALS['current_page'] = 78833;
$GLOBALS['consent'] = false;
function add_action($hook, $callback, $priority = 10) { $GLOBALS['hooks'][$hook][] = $callback; }
function apply_filters($hook, $value) { return $hook === 'la_guide_telemetry_consent_granted' ? $GLOBALS['consent'] : $value; }
function is_page($id) { return $GLOBALS['current_page'] === $id; }
function plugin_dir_path($file) { return dirname($file) . '/'; }
function plugin_dir_url($file) { return 'https://example.test/wp-content/plugins/guide-telemetry/'; }
function wp_enqueue_script(...$args) { $GLOBALS['enqueued'][] = $args; }
function wp_localize_script(...$args) { $GLOBALS['localized'][] = $args; }

require __DIR__ . '/../plugin/guide-telemetry/guide-telemetry.php';
assert(isset($GLOBALS['hooks']['wp_enqueue_scripts']), 'enqueue hook registered');

// Default is fail-closed even on the Guide page.
LA_Guide_Telemetry::enqueue();
assert(count($GLOBALS['enqueued']) === 0, 'no enqueue without explicit consent');

// Wrong page never enqueues, even if consent is granted.
$GLOBALS['consent'] = true;
$GLOBALS['current_page'] = 123;
LA_Guide_Telemetry::enqueue();
assert(count($GLOBALS['enqueued']) === 0, 'no enqueue off Guide page');

// Guide page + explicit grant enqueues only the local observer.
$GLOBALS['current_page'] = 78833;
LA_Guide_Telemetry::enqueue();
assert(count($GLOBALS['enqueued']) === 1, 'one script enqueued on Guide page');
assert($GLOBALS['enqueued'][0][0] === 'la-guide-telemetry', 'expected script handle');
assert($GLOBALS['enqueued'][0][1] === 'https://example.test/wp-content/plugins/guide-telemetry/assets/guide-telemetry.js', 'local script URL');
assert(count($GLOBALS['localized']) === 1, 'page-scoped config localized');
assert($GLOBALS['localized'][0][2]['pageId'] === 78833, 'page ID pinned');
assert($GLOBALS['localized'][0][2]['consentGranted'] === true, 'explicit consent passed to client');

echo "PASS: PHP enqueue contract (3 groups)\n";
