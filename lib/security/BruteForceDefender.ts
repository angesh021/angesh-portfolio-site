/**
 * File: /lib/security/BruteForceDefender.ts
 * Author: Angesh Chanderdip 
 * Purpose: Defends against brute-force, dictionary, and password-spraying attacks across credentials inputs.
 * Responsibilities:
 *   - Implements progressive linear and exponential back-off delays between authentication checks.
 *   - Maintains in-memory (or storage-backed) tracking of unsuccessful login attempts.
 *   - Programmatically triggers hard lockouts when threshold bounds are breached.
 * Dependencies: None (pure JS/TS timing capabilities)
 * Notes: Ensures standard automated brute-force scripts are slowed down to near-infinite execution times.
 * Changelog:
 *   - 2026-06-11: Extracted and designed standardized brute-force safeguards.
 */

// ========================================
// Interfaces & Types
// ========================================

export interface DefenderRecord {
    attempts: number;
    lastAttemptTimestamp: number;
    lockedUntil: number;
}

export interface AccessReport {
    isAllowed: boolean;
    remainingCooldownSeconds: number;
    attemptsCount: number;
    message?: string;
}

// ========================================
// Main Service Execution
// ========================================

export class BruteForceDefender {

    // In-memory key-value database to hold temporary lock states on server routes
    private static memoryRegistry: Map<string, DefenderRecord> = new Map();

    private static readonly MAX_ATTEMPTS: number = 5; // Allow max 5 attempts before a hard delay
    private static readonly LOCK_DURATION_MS: number = 300000; // 5-minute cooldown default
    private static readonly PENALTY_INCREMENT_MS: number = 2000; // Progressive delay scales by 2s per fail

    /**
     * Purpose: Verifies if a given identity key (IP or Username) is currently locked out.
     * @param {string} identityKey A distinct string tracking the client (e.g., client IP or username).
     * @param {string} [storageMode='memory'] Configures 'memory' or 'session' (to allow client integration seamlessly).
     * @returns {AccessReport} Structural authorization assessment.
     * Notes: Should be verified prior to doing expensive database lookup or cryptographic password check.
     */
    public static auditAccess(identityKey: string, storageMode: 'memory' | 'session' = 'memory'): AccessReport {
        const record = this.retrieveRecord(identityKey, storageMode);
        const now = Date.now();

        // 1. Check for Active Lockout Timers
        if (record.lockedUntil > now) {
            const remainingSecs = Math.ceil((record.lockedUntil - now) / 1000);
            return {
                isAllowed: false,
                remainingCooldownSeconds: remainingSecs,
                attemptsCount: record.attempts,
                message: `ACCESS_SUSPENDED: Excessive auth failures. Account key is locked. Try again in ${remainingSecs}s.`
            };
        }

        // 2. Check for Progressive Delays
        // If they failed e.g. 3 times, calculate a short cooling-off delay to slow down automated bots
        if (record.attempts > 0) {
            const requiredBuffer = record.attempts * this.PENALTY_INCREMENT_MS;
            const elapsedSinceLast = now - record.lastAttemptTimestamp;
            if (elapsedSinceLast < requiredBuffer) {
                const waitSecs = Math.ceil((requiredBuffer - elapsedSinceLast) / 1000);
                return {
                    isAllowed: false,
                    remainingCooldownSeconds: waitSecs,
                    attemptsCount: record.attempts,
                    message: `COOL_DOWN_ACTIVE: Progressive login protection active. Please wait ${waitSecs}s.`
                };
            }
        }

        return {
            isAllowed: true,
            remainingCooldownSeconds: 0,
            attemptsCount: record.attempts
        };
    }

    /**
     * Purpose: Registers a login failure and calculates next back-off curves.
     * @param {string} identityKey Target client descriptor token.
     * @param {string} [storageMode='memory'] Storage structure backend option.
     * @returns {AccessReport} The new updated access report.
     */
    public static registerFailure(identityKey: string, storageMode: 'memory' | 'session' = 'memory'): AccessReport {
        const record = this.retrieveRecord(identityKey, storageMode);
        const now = Date.now();

        record.attempts += 1;
        record.lastAttemptTimestamp = now;

        // If threshold has been crossed, initiate hard temporary block duration
        if (record.attempts >= this.MAX_ATTEMPTS) {
            record.lockedUntil = now + this.LOCK_DURATION_MS;
        }

        this.persistRecord(identityKey, record, storageMode);

        const remainingSecs = record.lockedUntil > now ? Math.ceil((record.lockedUntil - now) / 1000) : 0;

        return {
            isAllowed: false,
            remainingCooldownSeconds: remainingSecs,
            attemptsCount: record.attempts,
            message: remainingSecs > 0
                ? `SECURITY_WARNING: Maximum attempts exceeded. Locked out for ${remainingSecs} seconds.`
                : `AUTHENTICATION_FAILED: Attempt ${record.attempts}/${this.MAX_ATTEMPTS}.`
        };
    }

    /**
     * Purpose: Clears all failure historical marks after a successful credentials matches.
     * @param {string} identityKey Identity descriptor.
     * @param {string} [storageMode='memory'] Storage structure backend option.
     */
    public static clearFailureRecord(identityKey: string, storageMode: 'memory' | 'session' = 'memory'): void {
        if (storageMode === 'memory') {
            this.memoryRegistry.delete(identityKey);
        } else {
            try {
                sessionStorage.removeItem(`brute_${identityKey}`);
            } catch (e) {
                console.error("Storage access rejected:", e);
            }
        }
    }

    // ========================================
    // Internal Helper Utilities
    // ========================================

    private static retrieveRecord(key: string, storageMode: 'memory' | 'session'): DefenderRecord {
        const blankRecord: DefenderRecord = { attempts: 0, lastAttemptTimestamp: 0, lockedUntil: 0 };

        if (storageMode === 'memory') {
            return this.memoryRegistry.get(key) || { ...blankRecord };
        } else {
            try {
                const cached = sessionStorage.getItem(`brute_${key}`);
                if (cached) {
                    return JSON.parse(cached);
                }
            } catch (e) {
                console.warn("Session storage parsing failed under frame restrictions", e);
            }
            return { ...blankRecord };
        }
    }

    private static persistRecord(key: string, record: DefenderRecord, storageMode: 'memory' | 'session'): void {
        if (storageMode === 'memory') {
            this.memoryRegistry.set(key, record);
        } else {
            try {
                sessionStorage.setItem(`brute_${key}`, JSON.stringify(record));
            } catch (e) {
                console.warn("Session storage save blocked sub-iframe boundary rules", e);
            }
        }
    }
}
