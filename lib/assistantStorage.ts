/**
 * Aegis AI Assistant Local Storage Service
 * Handles client-side session persistence, conversation history recovery,
 * and state synchronization across page reloads.
 */

export interface SavedMessageItem {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  showWidgets?: boolean;
  contextualChips?: string[];
  hasError?: boolean;
  telemetry?: {
    engine: "gemini" | "rag";
    model?: string;
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    tokensAvailable?: string;
    contextLimit?: number;
    matchPercentage?: number;
    vectorScore?: number;
    topSource?: string;
  };
}

export interface SavedAssistantSession {
  version: number;
  messages: SavedMessageItem[];
  conversationHistory: Array<{ role: "user" | "model"; text: string }>;
  telemetry?: SavedMessageItem["telemetry"] | null;
  isClearedState?: boolean;
  recruiterMode?: boolean;
  wireframeMode?: boolean;
  updatedAt: number;
}

const STORAGE_KEY = "aegis_assistant_session_v1";
const CURRENT_VERSION = 1;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days TTL
const MAX_SAVED_MESSAGES = 60; // Keep storage lightweight

/**
 * Checks if browser localStorage is available
 */
const isStorageAvailable = (): boolean => {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const testKey = "__aegis_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Retrieves and validates the saved conversation session from localStorage
 */
export const loadAssistantSession = (): SavedAssistantSession | null => {
  if (!isStorageAvailable()) return null;

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEY);
    if (!rawData) return null;

    const parsed: SavedAssistantSession = JSON.parse(rawData);

    // Basic schema and version validation
    if (!parsed || parsed.version !== CURRENT_VERSION || !Array.isArray(parsed.messages)) {
      return null;
    }

    // Check expiration (TTL)
    if (parsed.updatedAt && Date.now() - parsed.updatedAt > SESSION_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Filter out invalid/empty messages
    parsed.messages = parsed.messages
      .filter((m) => m && typeof m.id === "string" && (m.role === "user" || m.role === "model"))
      .slice(-MAX_SAVED_MESSAGES);

    parsed.conversationHistory = (parsed.conversationHistory || [])
      .filter((h) => h && (h.role === "user" || h.role === "model") && typeof h.text === "string" && h.text.trim().length > 0)
      .slice(-20);

    return parsed;
  } catch (err) {
    console.warn("[Aegis Storage] Failed to load conversation history from localStorage:", err);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    return null;
  }
};

/**
 * Persists the current assistant conversation session into localStorage
 */
export const saveAssistantSession = (sessionData: {
  messages: SavedMessageItem[];
  conversationHistory: Array<{ role: "user" | "model"; text: string }>;
  telemetry?: SavedMessageItem["telemetry"] | null;
  isClearedState?: boolean;
  recruiterMode?: boolean;
  wireframeMode?: boolean;
}): boolean => {
  if (!isStorageAvailable()) return false;

  try {
    // Only persist completed messages with text, trimmed to max capacity
    const sanitizedMessages = sessionData.messages
      .filter((m) => m && m.text && m.text.trim().length > 0)
      .slice(-MAX_SAVED_MESSAGES);

    const sanitizedHistory = (sessionData.conversationHistory || [])
      .filter((h) => h && h.text && h.text.trim().length > 0)
      .slice(-20);

    const payload: SavedAssistantSession = {
      version: CURRENT_VERSION,
      messages: sanitizedMessages,
      conversationHistory: sanitizedHistory,
      telemetry: sessionData.telemetry || null,
      isClearedState: sessionData.isClearedState ?? false,
      recruiterMode: sessionData.recruiterMode ?? false,
      wireframeMode: sessionData.wireframeMode ?? false,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn("[Aegis Storage] Failed to save conversation history to localStorage:", err);
    return false;
  }
};

/**
 * Clears the persisted assistant conversation session from localStorage
 */
export const clearAssistantSession = (): void => {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[Aegis Storage] Failed to clear conversation history from localStorage:", err);
  }
};

/**
 * Checks if there is an active saved conversation
 */
export const hasSavedAssistantSession = (): boolean => {
  const session = loadAssistantSession();
  return Boolean(session && session.messages.length > 0);
};
