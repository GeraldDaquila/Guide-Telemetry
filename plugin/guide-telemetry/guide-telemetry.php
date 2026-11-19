<?php
/**
 * Plugin Name: Living Archive — Guide Telemetry
 * Description: Privacy-preserving, page-scoped interaction telemetry for The Guide. Does not load analytics vendors or collect visitor text.
 * Version: 0.1.1
 * Author: Living Archive
 */

if (!defined('ABSPATH')) { exit; }

final class LA_Guide_Telemetry {
    const PAGE_ID = 78833;
    const VERSION = '0.1.1';

    public static function boot() {
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue'), 30);
    }

    /**
     * Fail closed. A site-level CMP integration must explicitly return true
     * only after the visitor has granted the statistics category.
     */
    private static function consent_granted() {
        return (bool) apply_filters('la_guide_telemetry_consent_granted', false);
    }

    public static function enqueue() {
        if (!function_exists('is_page') || !is_page(self::PAGE_ID)) { return; }
        if (!self::consent_granted()) { return; }

        $relative = 'assets/guide-telemetry.js';
        $path = plugin_dir_path(__FILE__) . $relative;
        $url = plugin_dir_url(__FILE__) . $relative;
        $version = file_exists($path) ? (string) filemtime($path) : self::VERSION;

        wp_enqueue_script(
            'la-guide-telemetry',
            $url,
            array(),
            $version,
            true
        );

        wp_localize_script('la-guide-telemetry', 'LAGuideTelemetryConfig', array(
            'pageId' => self::PAGE_ID,
            'schemaVersion' => '1',
            'consentGranted' => true,
        ));
    }
}

LA_Guide_Telemetry::boot();
