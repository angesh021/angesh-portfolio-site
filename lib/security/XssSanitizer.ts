/**
 * File: /lib/security/XssSanitizer.ts
 * Author: Angesh Chanderdip 
 * Purpose: Specialised utility to prevent cross-site scripting (XSS) and code injection exploits.
 * Responsibilities:
 *   - Encodes untrusted user string inputs into HTML-safe character entities.
 *   - Prevents malicious script embedding (<script>, onclick, etc.) in dynamic interfaces.
 * Dependencies: None
 * Notes: Implements safe-mapping patterns recommended by OWASP guidelines.
 * Changelog:
 *   - 2026-06-11: Extracted from main security service to establish clean, modular maintainability.
 */

// ========================================
// Interfaces & Types
// ========================================

/**
 * Interface: XssSanitizerConfig
 * Purpose: Configures rules for character replacement workflows.
 */
export interface XssSanitizerConfig {
    allowBreaks?: boolean;
}

// ========================================
// Main Service Execution
// ========================================

export class XssSanitizer {

    /**
     * Purpose: Escapes core dangerous HTML characters to neutralize dynamic rendering vectors.
     * @param {string} text Raw client-entered string data
     * @param {XssSanitizerConfig} config Fine-tuning filters such as keeping multi-line formatting breaks
     * @returns {string} Sanitized text free of injection risks
     * @throws {Error} No throws expected (robust fallback returns empty string)
     * Notes: Safeguards inputs loaded into HTML renderers like dangerouslySetInnerHTML or email content.
     */
    public static sanitize(text: string, config?: XssSanitizerConfig): string {
        if (!text) {
            return '';
        }

        // Deep-replace key characters to bypass nested tags and entity parsing vulnerabilities
        let processed = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // Conditionally swap linebreaks safely for structured reading
        if (config?.allowBreaks) {
            processed = processed.replace(/\n/g, '<br/>');
        }

        return processed;
    }
}
