import { useState, useCallback } from 'react';

/**
 * Custom hook to perform a client-side proof-of-work challenge.
 * This is used as a bot-prevention measure. It's designed to be fast for a user's
 * browser but computationally expensive for bots making many requests.
 *
 * @returns An object containing the solving status and a function to start the challenge.
 */
export const useProofOfWork = () => {
    const [isSolving, setIsSolving] = useState(false);

    /**
     * Solves a SHA-256 proof-of-work challenge.
     * @param challenge A string to be included in the hash.
     * @param difficulty The number of leading zeros required in the hex hash.
     * @returns A promise that resolves to true if solved, false otherwise.
     */
    const solveChallenge = useCallback(async (challenge: string, difficulty: number): Promise<boolean> => {
        setIsSolving(true);
        try {
            const prefix = '0'.repeat(difficulty);
            let nonce = 0;
            const maxNonce = 1_000_000; // Safety break to prevent infinite loops

            while (nonce < maxNonce) {
                const attempt = `${challenge}:${nonce}`;
                const encoder = new TextEncoder();
                const data = encoder.encode(attempt);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                if (hashHex.startsWith(prefix)) {
                    console.log(`PoW solved with nonce ${nonce} in ${nonce + 1} iterations.`);
                    setIsSolving(false);
                    return true;
                }
                nonce++;
                
                // Yield to the main thread every so often to prevent UI freezing
                if (nonce % 10000 === 0) {
                     await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            console.warn(`PoW challenge not solved within ${maxNonce} iterations.`);
            setIsSolving(false);
            return false;

        } catch (error) {
            console.error("Error solving Proof of Work:", error);
            setIsSolving(false);
            return false;
        }
    }, []);

    return { isSolving, solveChallenge };
};