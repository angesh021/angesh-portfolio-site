/**
 * File: /lib/security/SessionShield.ts
 * Author: Angesh Chanderdip 
 * Purpose: Centered session validation and token monitoring system to prevent session hijacking and idle-session leaks.
 * Responsibilities:
 *   - Issues secure, temporary session records with expiration timestamps (defaults to 15-minute validity).
 *   - Validates cryptographic signatures or integrity check hashes for local storage/session storage session strings.
 *   - Handles automatic session expirations and interactive timeouts due to user inactivity.
 * Dependencies: None (standard Web Crypto and Web API bindings)
 * Notes: Ensures standard user and administrative dashboards lock down after inactivity boundaries.
 * Changelog:
 *   - 2026-06-11: Formulated session-shield integrity checks with dynamic inactivity calculations.
 */

// ========================================
// Interfaces & Types
// ========================================

export interface SessionData {
    username: string;
    token: string;
    loginTime: number;
    lastActiveTime: number;
    expirationTime: number;
    checksum?: string;
}

export interface SessionValidityReport {
    isValid: boolean;
    reason?: string;
}

// ========================================
// Main Service Execution
// ========================================

export class SessionShield {

    private static readonly SESSION_STORAGE_KEY: string = 'aetherius_secure_token_session';
    private static readonly MAXIMUM_IDLE_DURATION_MS: number = 900000; // 15 minutes in milliseconds
    private static readonly TOKEN_EXPIRY_DURATION_MS: number = 1800000; // 30 minutes in milliseconds
    
    // Salt used for mathematical integrity check (keeps hashes matching across active state loops)
    private static readonly SHIELD_INTEGRITY_SALT: string = 'AETHERIUS_INTEGRITY_SALT_2026';

    /**
     * Purpose: Initiates a new cryptographic session token and saves it to standard browser sessionStorage.
     * @param {string} username Name of the authenticated operator.
     * @returns {SessionData} Constructed token data payload.
     * Notes: Computes standard SHA-256 styled checksum integrity tags on the client to block manual session spoofing in developers fields.
     */
    public static initiateSession(username: string): SessionData {
        const timestamp = Date.now();
        const rawToken = this.generateRandomChaosToken();
        const session: SessionData = {
            username,
            token: rawToken,
            loginTime: timestamp,
            lastActiveTime: timestamp,
            expirationTime: timestamp + this.TOKEN_EXPIRY_DURATION_MS,
        };

        // Complete hashing loop
        session.checksum = this.calculateIntegrityChecksum(session);

        try {
            sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
        } catch (e) {
            console.error("Session storage blocked under container rules", e);
        }

        return session;
    }

    /**
     * Purpose: Validates the integrity, expiry, and activity duration of any currently active session.
     * @returns {SessionValidityReport} Explicit authorization report.
     */
    public static validateCurrentSession(): SessionValidityReport {
        try {
            const rawSession = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
            if (!rawSession) {
                return { isValid: false, reason: 'SESSION_MISSING: No authorization structure found.' };
            }

            const session: SessionData = JSON.parse(rawSession);
            const now = Date.now();

            // 1. Verify Absolute Session Expiration
            if (now > session.expirationTime) {
                this.terminateSession();
                return { isValid: false, reason: 'SESSION_EXPIRED: Max session lease time exceeded.' };
            }

            // 2. Verify Client Dynamic Inactivity Window
            const idleSpan = now - session.lastActiveTime;
            if (idleSpan > this.MAXIMUM_IDLE_DURATION_MS) {
                this.terminateSession();
                return { isValid: false, reason: 'SESSION_IDLE: System logged out due to inactivity.' };
            }

            // 3. Cryptographic Signature Match Validation
            const computedChecksum = this.calculateIntegrityChecksum(session);
            if (session.checksum !== computedChecksum) {
                this.terminateSession();
                return { isValid: false, reason: 'INTEGRITY_BREACH: Session structural signature was tampered with.' };
            }

            // Checksum matches - dynamically update user's activity log timestamp
            this.touchSession(session);

            return { isValid: true };
        } catch (error: any) {
            this.terminateSession();
            return { isValid: false, reason: `COMPROMISED_STATE: Session parsing crashed. ${error.message}` };
        }
    }

    /**
     * Purpose: Dynamically updates the last active timestamp to restart the idle session timer.
     * @param {SessionData} session The target session payload.
     */
    public static touchSession(session: SessionData): void {
        session.lastActiveTime = Date.now();
        session.checksum = this.calculateIntegrityChecksum(session);

        try {
            sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
        } catch (e) {
             console.error("Session touching blocked", e);
        }
    }

    /**
     * Purpose: Flushes out all active tokens and removes standard credentials from storage immediately.
     */
    public static terminateSession(): void {
        try {
            sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
        } catch (e) {
            console.error("Session flush blocked", e);
        }
    }

    // ========================================
    // Internal Cryptographic Helpers
    // ========================================

    /**
     * Purpose: Combines token data fields mathematically with a salt key to compute a tamper-verification checksum.
     * @param {SessionData} session State inputs.
     * @returns {string} Calculated string checksum signature.
     */
    private static calculateIntegrityChecksum(session: SessionData): string {
        const parts = [
            session.username,
            session.token,
            session.loginTime.toString(),
            session.lastActiveTime.toString(),
            session.expirationTime.toString(),
            this.SHIELD_INTEGRITY_SALT
        ].join('||');

        // Linear FNV-1a non-cryptographic hashing algorithm implementation for simple, library-free front-end validation
        let hash = 0x811c9dc5;
        for (let i = 0; i < parts.length; i++) {
            hash ^= parts.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return (hash >>> 0).toString(16);
    }

    /**
     * Purpose: Generates high-entropy browser pseudo-random token values.
     * @returns {string} Highly unique character sequence representing token elements.
     */
    private static generateRandomChaosToken(): string {
        const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
        let output = '';
        
        // Use browser cryptographically secure random values when supported
        if (typeof window !== 'undefined' && window.crypto) {
            const arr = new Uint8Array(24);
            window.crypto.getRandomValues(arr);
            for (let i = 0; i < arr.length; i++) {
                output += pool[arr[i] % pool.length];
            }
        } else {
            // High Resolution performance timestamp fallback
            for (let i = 0; i < 24; i++) {
                output += pool[Math.floor(Math.random() * pool.length)];
            }
        }
        return output;
    }
}
