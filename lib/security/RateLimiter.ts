/**
 * File: /lib/security/RateLimiter.ts
 * Author: Angesh Chanderdip 
 * Purpose: Keeps timing registers and tracks client-side form cooldown compliance to protect network transports.
 * Responsibilities:
 *   - Monitors persistent storage configurations to enforce structural client-side request limits.
 *   - Calculates the exact residual seconds remaining for active rate-limiting windows.
 *   - Verifies whether dynamic speed metrics match human capabilities.
 * Dependencies: LocalStorage browser engines
 * Notes: Ensures standard API routes are protected from rapid-fire form button clicks.
 * Changelog:
 *   - 2026-06-11: Extracted rate limit and human timing checkers to separate file for modular auditability.
 */

// ========================================
// Interfaces & Types
// ========================================

/**
 * Interface: RateLimitResult
 * Purpose: Structuring success state and message feedback for security prompts.
 */
export interface RateLimitResult {
    isValid: boolean;
    reason?: string;
}

// ========================================
// Main Service Execution
// ========================================

export class RateLimiter {

    /**
     * Purpose: Audits local client storage settings to verify if the cooldown window has elapsed.
     * @param {string} storageKey Location mapping target key where state is kept (defaults to 'portfolio_last_send').
     * @param {number} cooldownMs Cooldown threshold in milliseconds (defaults to 1 minute).
     * @returns {RateLimitResult} Evaluated authorization report.
     * @throws {Error} Safely handles sandbox iframe container exceptions where local storage is inaccessible.
     * Notes: Enhances system resilience by stopping spam immediately on the frontend.
     */
    public static auditClientRateLimit(storageKey: string = 'portfolio_last_send', cooldownMs: number = 60000): RateLimitResult {
        try {
            const preservedTimestamp = localStorage.getItem(storageKey);
            if (preservedTimestamp) {
                const elapsedSinceLastSend = Date.now() - parseInt(preservedTimestamp, 10);
                if (elapsedSinceLastSend < cooldownMs) {
                    const remainingSeconds = Math.ceil((cooldownMs - elapsedSinceLastSend) / 1000);
                    return {
                        isValid: false,
                        reason: `Rate limit active. Cooldown active for ${remainingSeconds} more seconds.`
                    };
                }
            }
        } catch (error) {
            // Log warning internally while ensuring browser accessibility remains operational if cookies are restricted
            console.warn("Iframe environment isolation restricted localStorage lookup:", error);
        }

        return { isValid: true };
    }

    /**
     * Purpose: Assesses component load elapsed times to confirm real-time user-agent interaction speeds.
     * @param {number} loadTime Component mount UNIX timestamp.
     * @param {number} minAllowedMs Base minimum speed allowed for standard humans (defaults to 3500ms).
     * @returns {RateLimitResult} Timing check outcome flag with automated warning details.
     * @throws {Error} None expected
     * Notes: Extremely quick submissions are highly indicative of automated script automation.
     */
    public static verifyHeuristicTiming(loadTime: number, minAllowedMs: number = 3500): RateLimitResult {
        const span = Date.now() - loadTime;
        if (span < minAllowedMs) {
            return {
                isValid: false,
                reason: `HEURISTIC_TRIGGER: Submission completed in ${span}ms. Suspected non-human flow.`
            };
        }
        return { isValid: true };
    }
}
