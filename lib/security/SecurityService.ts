/**
 * File: /lib/security/SecurityService.ts
 * Author: Angesh Chanderdip 
 * Purpose: Centered Single-Point Security-as-a-Service model acting as a unified facade for dedicated security modules.
 * Responsibilities:
 *   - Orchestrates client-side timing validations and rate limits by delegating to RateLimiter.
 *   - Directs input sanitization pipelines to XssSanitizer to mitigate script injections.
 *   - Coordinates payload shape audits by calling specialized PayloadValidator functions.
 *   - Interfaces telemetry masking with LogObfuscator to strip personal identifiers.
 * Dependencies: XssSanitizer, RateLimiter, PayloadValidator, LogObfuscator
 * Notes: Provides a single, high-cohesion, maintainable programmatic facade for clean organizational architectures.
 * Changelog:
 *   - 2026-06-11: Refactored to delegate internal policies to modular helper files for premium maintainability.
 */

import { XssSanitizer, XssSanitizerConfig } from "./XssSanitizer";
import { RateLimiter, RateLimitResult } from "./RateLimiter";
import { PayloadValidator } from "./PayloadValidator";
import { LogObfuscator } from "./LogObfuscator";
import { SessionShield, SessionData, SessionValidityReport } from "./SessionShield";
import { BruteForceDefender, AccessReport } from "./BruteForceDefender";
import { HttpHeaderShield } from "./HttpHeaderShield";

// ========================================
// Type Declarations & Interfaces
// ========================================

/**
 * Interface: ClientSecurityReport
 * Purpose: Represents structural metrics assessed before allowing form submissions. Re-exported for backward compatibility.
 */
export interface ClientSecurityReport {
    isValid: boolean;
    reason?: string;
}

/**
 * Interface: SanitizerConfig
 * Purpose: Custom rules to govern HTML entity encoding pipelines. Re-exported for backward compatibility.
 */
export interface SanitizerConfig {
    allowBreaks?: boolean;
}

// ========================================
// SecurityService Facade Class
// ========================================

export class SecurityService {

    // ========================================
    // Client-Side Security Routines
    // ========================================

    /**
     * Purpose: Delegates timing verification checks directly to the modular RateLimiter engine.
     * @param {number} loadTime Timestamp representing when the form component was first mounted.
     * @param {number} minAllowedMs Duration in milliseconds expected for a fast human to review and submit.
     * @returns {ClientSecurityReport} Validation report containing correctness state.
     * Notes: Rejects extremely fast automated submissions.
     */
    public static verifySubmissionTiming(loadTime: number, minAllowedMs: number = 3500): ClientSecurityReport {
        return RateLimiter.verifyHeuristicTiming(loadTime, minAllowedMs);
    }

    /**
     * Purpose: Delegates honeypot trap checks directly to the modular PayloadValidator engine.
     * @param {string[]} values List of honeypot field values retrieved from DOM components.
     * @returns {boolean} True if clean (no bot activity), False if decoy inputs contain text.
     * Notes: Decoys should remain empty.
     */
    public static validateHoneypots(values: (string | undefined | null)[]): boolean {
        return PayloadValidator.inspectHoneypots(values);
    }

    /**
     * Purpose: Delegates local storage rate audits directly to the modular RateLimiter engine.
     * @param {string} storageKey Target storage slot where final successful submission timestamps reside.
     * @param {number} cooldownMs Expected wait buffer between submissions (defaults to 1 minute).
     * @returns {ClientSecurityReport} Report indicating rate limiting block status.
     * Notes: Mitigates form double-posting and client-side flooding.
     */
    public static checkClientRateLimit(storageKey: string = 'portfolio_last_send', cooldownMs: number = 60000): ClientSecurityReport {
        return RateLimiter.auditClientRateLimit(storageKey, cooldownMs);
    }

    // ========================================
    // Brute-Force & Account Protection
    // ========================================

    /**
     * Purpose: Audit access based on identity keys to enforce timeouts and linear/exponential delays.
     */
    public static auditLoginAttempt(identityKey: string, storageMode: 'memory' | 'session' = 'memory'): AccessReport {
        return BruteForceDefender.auditAccess(identityKey, storageMode);
    }

    /**
     * Purpose: Records a failed credentials match to enforce security timers.
     */
    public static registerLoginFailure(identityKey: string, storageMode: 'memory' | 'session' = 'memory'): AccessReport {
        return BruteForceDefender.registerFailure(identityKey, storageMode);
    }

    /**
     * Purpose: Flushes out brute-force failure metrics for a specific authenticated key.
     */
    public static clearLoginFailures(identityKey: string, storageMode: 'memory' | 'session' = 'memory'): void {
        BruteForceDefender.clearFailureRecord(identityKey, storageMode);
    }

    // ========================================
    // Session & Auth Operations
    // ========================================

    /**
     * Purpose: Initiates a new securely signed and hashed browser session record.
     */
    public static createSession(username: string): SessionData {
        return SessionShield.initiateSession(username);
    }

    /**
     * Purpose: Evaluates integrity, timeouts, and checksums of user sessions.
     */
    public static checkSessionValidity(): SessionValidityReport {
        return SessionShield.validateCurrentSession();
    }

    /**
     * Purpose: Formally terminates and deletes session structures immediately.
     */
    public static destroySession(): void {
        SessionShield.terminateSession();
    }

    // ========================================
    // Server-Side Security & Sanitization
    // ========================================

    /**
     * Purpose: Exposes HTTP protective middleware to Server pipelines.
     */
    public static get HttpShieldMiddleware() {
        return HttpHeaderShield.enforceHeaders;
    }

    /**
     * Purpose: Coordinates input sanitation by delegating filtering actions to the XssSanitizer engine.
     * @param {string} text Raw string payload received from the request context.
     * @param {SanitizerConfig} config Optional configuration for escaping layouts or keeping line formatting.
     * @returns {string} Fully encoded string safe for HTML rendering.
     * Notes: Neutralizes XSS dynamic injections.
     */
    public static sanitizeInput(text: string, config?: SanitizerConfig): string {
        return XssSanitizer.sanitize(text, config);
    }

    /**
     * Purpose: Enforces size limits on payloads by delegating parameter audits to PayloadValidator.
     * @param {string} input String value under examination.
     * @param {number} maxLength Upper limit on characters allowed.
     * @returns {boolean} True if input remains within boundaries, False if size exceeds limits.
     * Notes: Neutralizes memory heap denial-of-service attempts.
     */
    public static validateLength(input: string | undefined | null, maxLength: number): boolean {
        return PayloadValidator.enforceBoundaries(input, maxLength);
    }

    /**
     * Purpose: Delegates email format structural checking directly to PayloadValidator.
     * @param {string} email Email address string under test.
     * @returns {boolean} True if email parses format validly.
     * Notes: Protects downstream SMTP protocols.
     */
    public static validateEmailFormat(email: string): boolean {
        return PayloadValidator.validateEmailFormat(email);
    }

    /**
     * Purpose: Coordinates logger protection pipelines by calling LogObfuscator helper functions.
     * @param {Record<string, any>} data Raw payload containing potential sensitive parameters.
     * @param {string[]} sensitiveKeys List of parameter names that should be obfuscated before print operations.
     * @returns {Record<string, any>} Cloned payload containing masked attributes safe for telemetry logging.
     * Notes: Prevents logs leakage of operational tokens or identity-revealing parameters.
     */
    public static maskSensitiveLogData(data: Record<string, any>, sensitiveKeys: string[] = ['apiKey', 'password', 'token', 'RESEND_API_KEY', 'email', 'message']): Record<string, any> {
        return LogObfuscator.mask(data, sensitiveKeys);
    }
}
