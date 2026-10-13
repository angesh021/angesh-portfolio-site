/**
 * Aegis AI Assistant Local Storage Service
 * Handles client-side session persistence, conversation history recovery,
 * and state synchronization across page reloads.
 */

export interface SavedMessageReaction {
  emoji: string;
  key: string;
  count: number;
  userReacted?: boolean;
  aegisReacted?: boolean;
  justStamped?: boolean;
}

export interface SavedMessageItem {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  showWidgets?: boolean;
  contextualChips?: string[];
  hasError?: boolean;
  isAegisReacting?: boolean;
  reactions?: SavedMessageReaction[];
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
  sessionId?: string;
  messages: SavedMessageItem[];
  conversationHistory: Array<{ role: "user" | "model"; text: string }>;
  telemetry?: SavedMessageItem["telemetry"] | null;
  isClearedState?: boolean;
  recruiterMode?: boolean;
  wireframeMode?: boolean;
  updatedAt: number;
}

export interface StoredConversation {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
  messageCount: number;
  messages: SavedMessageItem[];
  conversationHistory: Array<{ role: "user" | "model"; text: string }>;
  telemetry?: SavedMessageItem["telemetry"] | null;
}

const STORAGE_KEY = "aegis_assistant_session_v1";
const CONVERSATIONS_LIST_KEY = "aegis_assistant_conversations_v1";
const CURRENT_VERSION = 1;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days TTL
const MAX_SAVED_MESSAGES = 60; // Keep storage lightweight
const MAX_SAVED_CONVERSATIONS = 15; // History limit

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

    // Also auto-sync to saved conversation history if there are real messages
    if (sanitizedMessages.length > 0) {
      const firstUserMsg = sanitizedMessages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.text.slice(0, 42).trim() + (firstUserMsg.text.length > 42 ? "..." : "")
        : "Conversation with Aegis";
      
      const lastMsg = sanitizedMessages[sanitizedMessages.length - 1];
      const preview = lastMsg ? lastMsg.text.slice(0, 60).trim() + (lastMsg.text.length > 60 ? "..." : "") : "";

      saveConversationToHistory({
        id: "active_session",
        title,
        preview,
        updatedAt: Date.now(),
        messageCount: sanitizedMessages.length,
        messages: sanitizedMessages,
        conversationHistory: sanitizedHistory,
        telemetry: sessionData.telemetry || null,
      });
    }

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
 * Retrieves all stored conversations from history
 */
export const loadSavedConversations = (): StoredConversation[] => {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_LIST_KEY);
    if (!raw) return [];
    const list: StoredConversation[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.warn("[Aegis Storage] Failed to load conversations list:", err);
    return [];
  }
};

/**
 * Saves a conversation into history list
 */
export const saveConversationToHistory = (conv: StoredConversation): void => {
  if (!isStorageAvailable() || !conv || !conv.messages || conv.messages.length === 0) return;
  try {
    const existing = loadSavedConversations();
    const filtered = existing.filter((c) => c.id !== conv.id);
    const updatedList = [conv, ...filtered].slice(0, MAX_SAVED_CONVERSATIONS);
    window.localStorage.setItem(CONVERSATIONS_LIST_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn("[Aegis Storage] Failed to save conversation to history list:", err);
  }
};

/**
 * Deletes a single conversation from history
 */
export const deleteSavedConversation = (id: string): void => {
  if (!isStorageAvailable()) return;
  try {
    const existing = loadSavedConversations();
    const updated = existing.filter((c) => c.id !== id);
    window.localStorage.setItem(CONVERSATIONS_LIST_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("[Aegis Storage] Failed to delete conversation from history:", err);
  }
};

/**
 * Clears all conversation history
 */
export const clearAllSavedConversations = (): void => {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(CONVERSATIONS_LIST_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[Aegis Storage] Failed to clear all saved conversations:", err);
  }
};

/**
 * Exports conversation messages as real downloadable Markdown or JSON file
 */
export const exportConversationAsFile = (
  messages: SavedMessageItem[],
  format: "markdown" | "json"
): boolean => {
  if (typeof window === "undefined" || !messages || messages.length === 0) return false;

  const dateStr = new Date().toISOString().split("T")[0];

  try {
    if (format === "markdown") {
      let content = `# Aegis AI Assistant - Conversation Transcript\n`;
      content += `Generated on: ${new Date().toLocaleString()}\n`;
      content += `Total Messages: ${messages.length}\n\n---\n\n`;

      messages.forEach((m, idx) => {
        const sender = m.role === "user" ? "User" : "Aegis AI";
        content += `### [${idx + 1}] ${sender} (${m.timestamp || "N/A"})\n\n`;
        content += `${m.text}\n\n`;
        if (m.telemetry?.engine) {
          content += `> Engine: ${m.telemetry.engine.toUpperCase()} | Tokens: ${m.telemetry.tokensUsed ?? "N/A"}\n\n`;
        }
        content += `---\n\n`;
      });

      const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aegis-assistant-transcript-${dateStr}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } else {
      const payload = {
        title: "Aegis AI Assistant Export",
        exportedAt: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          timestamp: m.timestamp,
          telemetry: m.telemetry,
        })),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aegis-assistant-session-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    }
  } catch (err) {
    console.error("[Aegis Storage] Failed to export conversation:", err);
    return false;
  }
};

/**
 * Checks if there is an active saved conversation
 */
export const hasSavedAssistantSession = (): boolean => {
  const session = loadAssistantSession();
  return Boolean(session && session.messages.length > 0);
};
