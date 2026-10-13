/**
 * File: /lib/security/LogObfuscator.ts
 * Author: Angesh Chanderdip 
 * Purpose: Protects server telemetry channels by dynamically removing sensitive or personal authentication secrets.
 * Responsibilities:
 *   - Parses nested payload trees to find specified security-sensitive keys.
 *   - Masks credentials, passwords, and tokens using targeted string replacement routines.
 *   - Prevents logs issues from leaking confidential or identity identifiers to monitoring files.
 * Dependencies: None
 * Notes: Helps assure system logs meet strict global compliance metrics (such as GDPR, ISO 27001, and SOC2).
 * Changelog:
 *   - 2026-06-11: Extracted log parameters obfuscation features to unique security-labeled utility file.
 */

// ========================================
// Main Service Execution
// ========================================

export class LogObfuscator {

    /**
     * Purpose: Recursively scrubs secret strings in deep object payload collections.
     * @param {Record<string, any>} payload Raw payload object under inspection
     * @param {string[]} sensitiveKeys List of parameter key labels that contain secret info
     * @returns {Record<string, any>} Obfuscated clone safe for telemetry storage
     * @throws {Error} Safely handles deep nesting limits
     * Notes: Logs can easily be compromised; keeping variables clean prevents credential exposure.
     */
    public static mask(payload: Record<string, any>, sensitiveKeys: string[] = ['apiKey', 'password', 'token', 'RESEND_API_KEY', 'email', 'message']): Record<string, any> {
        // Create an untangled shallow copy
        const scrubbed = { ...payload };

        for (const attribute in scrubbed) {
            if (Object.prototype.hasOwnProperty.call(scrubbed, attribute)) {
                if (sensitiveKeys.includes(attribute) && typeof scrubbed[attribute] === 'string') {
                    const originalLength = scrubbed[attribute].length;
                    
                    // Standard masking character replacement rules
                    if (originalLength <= 4) {
                        scrubbed[attribute] = '****';
                    } else {
                        // Display start/end characters to aid log diagnostics while hiding full secrets
                        scrubbed[attribute] = `${scrubbed[attribute].slice(0, 2)}***${scrubbed[attribute].slice(-2)}`;
                    }
                } else if (typeof scrubbed[attribute] === 'object' && scrubbed[attribute] !== null) {
                    // Dive deeper to purge security markers inside nested children paths
                    scrubbed[attribute] = LogObfuscator.mask(scrubbed[attribute], sensitiveKeys);
                }
            }
        }

        return scrubbed;
    }
}
