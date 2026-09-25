/**
 * @fileoverview
 * Decoupled Assistant Chatbot Router & Service Engine.
 * Serves Aegis AI Assistant queries with Gemini streaming, RAG knowledge retrieval,
 * rate-limiting, and local fallbacks.
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel, Modality } from '@google/genai';
import { getKnowledgeBase } from '../lib/knowledgeBase.js';
import {
  createSemanticChunks,
  expandQuery,
  hybridRRFSearch,
  buildRehydratedContext,
  tokenizeText,
  generateTfidfVector
} from '../lib/ragEngine.js';
import { recordAiEvent } from '../lib/db.js';
import { inspectPromptSecurity, getAutomatedGuardrailResponse } from '../lib/guardrails.js';
import { globalSemanticCache } from '../lib/semanticCache.js';

const router = Router();

// ============================================================================
// Canadian Dollar (CAD) Currency Conversion & Token Cost Rate Card
// ============================================================================
const USD_TO_CAD = 1.36;
const CAD_RATES = {
  LITE_INPUT_PER_1M: Number((0.075 * USD_TO_CAD).toFixed(4)), // $0.1020 CAD
  LITE_OUTPUT_PER_1M: Number((0.30 * USD_TO_CAD).toFixed(4)),  // $0.4080 CAD
  FLASH_INPUT_PER_1M: Number((0.10 * USD_TO_CAD).toFixed(4)), // $0.1360 CAD
  FLASH_OUTPUT_PER_1M: Number((0.40 * USD_TO_CAD).toFixed(4)), // $0.5440 CAD
  RAG_SAVED_PER_1M: Number((0.20 * USD_TO_CAD).toFixed(4)),    // $0.2720 CAD
};

// ============================================================================
// 1. Gemini Client Initialization
// ============================================================================

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing from server configuration.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// ============================================================================
// 2. State & In-Memory Caching
// ============================================================================

interface AssistantCacheEntry {
  fullText: string;
  chunks: string[];
  meta?: any;
  timestamp: number;
}

const assistantResponseCache = new Map<string, AssistantCacheEntry>();
const ASSISTANT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL
const ASSISTANT_CACHE_MAX_SIZE = 200;

export const assistantStats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  geminiSuccesses: 0,
  fallbackCount: 0,
  vectorSearches: 0,
  startTime: Date.now()
};

const assistantRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const MODEL_ROUTING = {
  primary: "gemini-3.1-flash-lite",
  fallback: "gemini-3.5-flash-lite",
  emergency: "gemini-flash-latest",
};

// Tracks temporary model cooldowns (e.g. 429 quota exhaustion or 503 high demand spikes)
const modelCooldownMap = new Map<string, number>();

const isModelAvailable = (modelName: string): boolean => {
  const expiresAt = modelCooldownMap.get(modelName);
  if (!expiresAt) return true;
  if (Date.now() > expiresAt) {
    modelCooldownMap.delete(modelName);
    return true;
  }
  return false;
};

const setModelCooldown = (modelName: string, durationMs: number = 60000) => {
  modelCooldownMap.set(modelName, Date.now() + durationMs);
};

// Helper: Get or compute Dense Semantic Vector Embedding using Gemini API or TF-IDF Vector Space
const getQueryEmbeddingVector = async (
  text: string,
  vocab: string[],
  idfMap: Map<string, number>
): Promise<{ vector: number[]; isGemini: boolean }> => {
  if (isModelAvailable('gemini-embedding-2-preview')) {
    try {
      const ai = getGeminiClient();
      if (ai) {
        const embedPromise = ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: text,
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Embedding timeout")), 250)
        );
        const res: any = await Promise.race([embedPromise, timeoutPromise]);
        const values = res?.embedding?.values || res?.embeddings?.[0]?.values;
        if (values && Array.isArray(values) && values.length > 0) {
          return { vector: values, isGemini: true };
        }
      }
    } catch (e: any) {
      setModelCooldown('gemini-embedding-2-preview', 45000);
    }
  }
  return { vector: generateTfidfVector(text, vocab, idfMap), isGemini: false };
};

const setCachedResponse = (key: string, fullText: string, chunks: string[], meta?: any) => {
  if (assistantResponseCache.size >= ASSISTANT_CACHE_MAX_SIZE) {
    const oldestKey = assistantResponseCache.keys().next().value;
    if (oldestKey) assistantResponseCache.delete(oldestKey);
  }
  assistantResponseCache.set(key, {
    fullText,
    chunks,
    meta,
    timestamp: Date.now()
  });
};

const getAssistantCacheKey = (msg: string, lang: string, recruiterMode: boolean): string => {
  const norm = msg.trim().toLowerCase().replace(/[?!=.,]/g, '');
  return `${norm}_${lang}_${recruiterMode ? 'rec' : 'norm'}`;
};

// ============================================================================
// 3. Health & Stats Routes
// ============================================================================

router.get(["/health", "/api/assistant/health", "/api/portfolio-assistant/health"], (req: Request, res: Response) => {
  const enKb = getKnowledgeBase('en') || [];
  const frKb = getKnowledgeBase('fr') || [];
  let geminiConfigured = false;
  try {
    geminiConfigured = !!process.env.GEMINI_API_KEY;
  } catch (e) {
    geminiConfigured = false;
  }

  return res.json({
    status: "healthy",
    assistantName: "Aegis AI Security & Portfolio Assistant",
    version: "2.5.0",
    knowledgeBase: {
      enCount: enKb.length,
      frCount: frKb.length,
      totalItems: enKb.length + frKb.length
    },
    geminiIntegration: {
      configured: geminiConfigured,
      routing: MODEL_ROUTING,
      activeModels: [
        MODEL_ROUTING.primary,
        MODEL_ROUTING.fallback,
        MODEL_ROUTING.emergency
      ]
    },
    cacheEngine: {
      cachedEntries: assistantResponseCache.size,
      maxEntries: ASSISTANT_CACHE_MAX_SIZE,
      hits: assistantStats.cacheHits,
      misses: assistantStats.cacheMisses,
      hitRatio: assistantStats.totalRequests > 0 
        ? `${((assistantStats.cacheHits / assistantStats.totalRequests) * 100).toFixed(1)}%` 
        : "0%"
    },
    metrics: {
      totalRequests: assistantStats.totalRequests,
      geminiSuccesses: assistantStats.geminiSuccesses,
      fallbackCount: assistantStats.fallbackCount,
      uptimeSeconds: Math.floor((Date.now() - assistantStats.startTime) / 1000)
    },
    timestamp: new Date().toISOString()
  });
});

router.get(["/stats", "/api/assistant/stats"], (req: Request, res: Response) => {
  return res.json({
    assistantStats,
    cacheSize: assistantResponseCache.size,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// 4. Primary Assistant Chat SSE Handler
// ============================================================================

router.post(["/chat", "/api/portfolio-assistant/chat", "/api/assistant/chat"], async (req: Request, res: Response) => {
  let lang: 'en' | 'fr' = 'en';
  const startChatTime = Date.now();
  try {
    assistantStats.totalRequests++;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    // Simple rate limiting (max 30 requests per minute per IP)
    const nowMs = Date.now();
    const ipRate = assistantRateLimitMap.get(clientIp);
    if (ipRate) {
      if (nowMs > ipRate.resetTime) {
        assistantRateLimitMap.set(clientIp, { count: 1, resetTime: nowMs + 60000 });
      } else {
        ipRate.count++;
        if (ipRate.count > 30) {
          return res.status(429).json({ error: "Too many assistant requests. Please wait a moment." });
        }
      }
    } else {
      assistantRateLimitMap.set(clientIp, { count: 1, resetTime: nowMs + 60000 });
    }

    const { message, history, locale, recruiterMode } = req.body;
    lang = locale === 'fr' ? 'fr' : 'en';

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Missing or invalid 'message' parameter." });
    }

    // Input Sanitization (max 1000 chars, strip HTML)
    const sanitizedMessage = message.trim().slice(0, 1000).replace(/<[^>]*>?/gm, '');

    // 2. Prompt Injection & Adversarial Probe Security Inspection
    const secAnalysis = inspectPromptSecurity(sanitizedMessage);
    if (secAnalysis.shouldTriggerGuardrail) {
      const guardrailResp = getAutomatedGuardrailResponse(lang, secAnalysis.threatCategory);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      res.write(`data: ${JSON.stringify({
        meta: {
          engine: "guardrail",
          securityFlag: secAnalysis.flag,
          threatCategory: secAnalysis.threatCategory,
          threatScore: secAnalysis.threatScore,
          guardrailTriggered: true,
          topSource: "AEGIS Automated Security Guardrail"
        }
      })}\n\n`);

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      for (const chunk of guardrailResp.chunks) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        await delay(12);
      }
      res.write('data: [DONE]\n\n');

      const guardrailInTokens = Math.ceil(sanitizedMessage.length / 3.8);
      const guardrailOutTokens = Math.ceil(guardrailResp.text.length / 3.8);
      const guardrailTotalTokens = guardrailInTokens + guardrailOutTokens;
      const guardrailSavedCad = Number(((guardrailTotalTokens / 1000000) * CAD_RATES.RAG_SAVED_PER_1M).toFixed(6));

      recordAiEvent({
        message_preview: sanitizedMessage,
        response_preview: guardrailResp.text.slice(0, 300),
        engine: 'rag',
        model: 'aegis-security-guardrail',
        input_tokens: guardrailInTokens,
        output_tokens: guardrailOutTokens,
        total_tokens: guardrailTotalTokens,
        cost_cad: 0,
        cost_saved_cad: guardrailSavedCad,
        cost_usd: 0,
        cost_saved_usd: Number((guardrailSavedCad / USD_TO_CAD).toFixed(6)),
        latency_ms: Date.now() - startChatTime,
        is_cache_hit: false,
        security_flag: secAnalysis.flag,
        threat_category: secAnalysis.threatCategory,
        threat_score: secAnalysis.threatScore,
        guardrail_triggered: true,
        language: lang,
        recruiter_mode: !!recruiterMode,
        fallback_triggered: true
      });

      return res.end();
    }

    // 3. Semantic Similarity & Exact Match Cache Lookup
    const cacheLookup = globalSemanticCache.lookup(sanitizedMessage, lang, !!recruiterMode);
    if (cacheLookup) {
      assistantStats.cacheHits++;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const cacheMeta = cacheLookup.entry.meta ? {
        ...cacheLookup.entry.meta,
        isSemanticMatch: cacheLookup.isSemantic,
        semanticSimilarity: cacheLookup.similarity,
        cached: true
      } : {
        engine: "rag",
        matchPercentage: Math.round(cacheLookup.similarity * 100),
        isSemanticMatch: cacheLookup.isSemantic,
        semanticSimilarity: cacheLookup.similarity,
        topSource: cacheLookup.isSemantic ? "Semantic Vector Similarity Cache" : "Exact-Match Cache",
        cached: true
      };

      res.write(`data: ${JSON.stringify({ meta: cacheMeta })}\n\n`);

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      for (const chunk of cacheLookup.entry.chunks) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        await delay(6);
      }
      res.write('data: [DONE]\n\n');

      const cachedOutputTokens = Math.ceil(cacheLookup.entry.fullText.length / 3.8);
      const savedCad = Number(((cachedOutputTokens / 1000000) * CAD_RATES.LITE_OUTPUT_PER_1M).toFixed(6));

      recordAiEvent({
        message_preview: sanitizedMessage,
        response_preview: cacheLookup.entry.fullText.slice(0, 300),
        engine: 'rag',
        model: cacheLookup.isSemantic ? 'Semantic Cache' : 'In-Memory Cache',
        input_tokens: 0,
        output_tokens: cachedOutputTokens,
        total_tokens: cachedOutputTokens,
        cost_cad: 0,
        cost_saved_cad: savedCad,
        cost_usd: 0,
        cost_saved_usd: Number((savedCad / USD_TO_CAD).toFixed(6)),
        latency_ms: Date.now() - startChatTime,
        is_cache_hit: true,
        is_semantic_cache_hit: cacheLookup.isSemantic,
        semantic_similarity: Math.round(cacheLookup.similarity * 100),
        security_flag: secAnalysis.flag,
        threat_category: secAnalysis.threatCategory,
        threat_score: secAnalysis.threatScore,
        guardrail_triggered: false,
        language: lang,
        recruiter_mode: !!recruiterMode,
        fallback_triggered: false
      });

      return res.end();
    }

    assistantStats.cacheMisses++;

    // 1. Retrieve knowledge directly from primary source ground truth (knowledgeBase.ts)
    let knowledgeItems = getKnowledgeBase(lang);
    if (!knowledgeItems || knowledgeItems.length === 0) {
      const knowledgePath = path.join(process.cwd(), 'content', 'assistant-knowledge.json');
      if (fs.existsSync(knowledgePath)) {
        try {
          knowledgeItems = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
        } catch (e) {
          console.error("Failed to parse assistant-knowledge.json:", e);
        }
      }
    }

    // 2. Query Expansion & Advanced Intent Analysis
    const expandedQuery = expandQuery(sanitizedMessage, lang);

    // --- Advanced RAG Engine: Semantic Chunking, Multi-Query Expansion, RRF & Context Rehydration ---
    assistantStats.vectorSearches++;
    const currentLangItems = knowledgeItems.filter(item => item.locale === lang);

    // Create Parent-Child & Overlapping Semantic Chunks
    const semanticChunks = createSemanticChunks(currentLangItems);

    // Build Vocabulary & IDF Matrix across semantic corpus
    const corpusTokens = currentLangItems.map(item => 
      tokenizeText(`${item.title} ${item.content} ${(item.keywords || []).join(" ")} ${(item.technologies || []).join(" ")}`)
    );

    const vocabSet = new Set<string>();
    corpusTokens.forEach(doc => doc.forEach(term => vocabSet.add(term)));
    const vocab = Array.from(vocabSet);

    const dfMap = new Map<string, number>();
    corpusTokens.forEach(doc => {
      const uniqueInDoc = new Set(doc);
      uniqueInDoc.forEach(term => dfMap.set(term, (dfMap.get(term) || 0) + 1));
    });
    const totalDocs = corpusTokens.length || 1;
    const idfMap = new Map<string, number>();
    vocab.forEach(term => {
      const df = dfMap.get(term) || 1;
      idfMap.set(term, Math.log((totalDocs + 1) / (df + 0.5)) + 1.0);
    });

    // Obtain Dense Semantic Embedding Vector (Gemini API text-embedding-004 or TF-IDF Vector Space)
    const queryEmbeddingResult = await getQueryEmbeddingVector(sanitizedMessage, vocab, idfMap);
    const queryVector = queryEmbeddingResult.vector;

    // Execute Hybrid Search with Reciprocal Rank Fusion (RRF: BM25/TF-IDF + Dense Vector Cosine Similarity)
    const rrfResults = hybridRRFSearch(expandedQuery, semanticChunks, currentLangItems, queryVector, vocab, idfMap, 5);

    // Re-hydrate Parent Document Contexts with Attributed Source Meta
    const rehydrated = buildRehydratedContext(rrfResults, currentLangItems, lang, expandedQuery.intents.isGreeting);
    const relevantItems = rehydrated.relevantItems;
    const context = rehydrated.formattedContext;

    // Configure system instruction
    const systemInstruction = `You are Aegis, an elite AI Security Operations & Portfolio Intelligence Assistant built for Angesh Chanderdip — a Cybersecurity Engineer specializing in Network Access Control (NAC), Cisco ISE, endpoint security, Active Directory, SIEM threat detection, and security automation.

NAME & PERSONALITY:
- Name: Aegis
- Persona: A sharp, articulate, concise, and highly intelligent portfolio AI assistant. Speaks with professional clarity, technical precision, and warm approachability.
- Core Specialties:
  1. Answering any questions about Angesh Chanderdip's background, work experience (General Motors, GTECHNA), projects (Home SOC Lab, Enterprise NAC Lab, Aura, Admin Dashboard), certifications (CompTIA Security+, Blue Team Level 1 / BTL1), talents/skills, and contact details.
  2. Answering ANY cybersecurity, networking, software engineering, or technical question accurately.

RESPONSE GUIDELINES:
1. DIRECTNESS & CONCISENESS (CRITICAL):
   - Get STRAIGHT TO THE POINT. Answer the user's specific question directly in 2 to 4 clear, well-structured sentences or concise bullet points.
   - Do NOT dump raw database records, raw internal field names (e.g. "Certification Name:", "Issuer:"), or excessive background text.
   - Speak in natural, human-readable conversational prose. Avoid ugly raw Markdown headers like '###' or '***'.

2. ACCURACY & GROUND TRUTH KNOWLEDGE:
   - For questions about Angesh: Rely strictly on the provided PORTFOLIO CONTEXT.
   - For technical or general questions: Provide accurate technical explanations.
   - For simple greetings or small talk: Respond warmly and concisely in 1-2 sentences.

3. PRONOUN & MODE RULE:
   ${recruiterMode 
     ? "Recruiter Mode is ACTIVE: Speak directly in the FIRST PERSON as Angesh Chanderdip ('I', 'my', 'me'). Highlight my accomplishments at General Motors and GTECHNA." 
     : "Speak as Aegis in the THIRD PERSON regarding Angesh ('Angesh', 'he', 'his')."}

4. LANGUAGE:
   - Speak strictly in ${lang === 'fr' ? "FRENCH" : "ENGLISH"}.

5. ACTION BUTTONS:
   Append relevant action tags ONLY when appropriate at the very end on a new line:
   - [ACTION: navigate:#section_name] (sections: hero, about, experience, projects, education, contact)
   - [ACTION: open_project:slug]
   - [ACTION: download_resume:${lang}]
   - [ACTION: open_contact]
   - [ACTION: open_schedule] (for meeting scheduling, booking a discussion, interviews, or sync requests)

[PORTFOLIO CONTEXT]:
${context || "No specific portfolio entries matched. Answer using your security intelligence and offer to assist with Angesh's cybersecurity portfolio."}
`;

    // Formulate Contents
    const contents: any[] = [];
    if (Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Set up Gemini Client and attempt to stream
    let streamedSuccessfully = false;
    try {
      const ai = getGeminiClient();

      let activeIterator: AsyncIterator<any> | null = null;
      let firstActiveChunk: any = null;
      let directGeneratedText: string | null = null;
      let successfulModelName = MODEL_ROUTING.primary;

      const candidateModels = [
        MODEL_ROUTING.primary,       // gemini-3.1-flash-lite
        MODEL_ROUTING.fallback,      // gemini-3.5-flash-lite
        MODEL_ROUTING.emergency,     // gemini-flash-latest
        "gemini-3-flash-preview",
        "gemini-3.8-flash"
      ];

      // Evaluate active models according to prioritized MODEL_ROUTING tiers
      const availableModels = candidateModels.filter(m => isModelAvailable(m));

      for (const modelName of availableModels) {
        const modelConfig: any = {
          systemInstruction,
          temperature: 0.25,
        };

        try {
          const streamPromise = ai.models.generateContentStream({
            model: modelName,
            contents,
            config: modelConfig
          });
          const streamInitTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Stream init timeout")), 10000)
          );
          const responseStream: any = await Promise.race([streamPromise, streamInitTimeout]);
          if (responseStream) {
            const iterator = responseStream[Symbol.asyncIterator]();
            const firstChunkPromise = iterator.next();
            const firstTimeout = new Promise<{ done: boolean; value?: any }>((_, reject) =>
              setTimeout(() => reject(new Error("First chunk timeout")), 8000)
            );
            const firstResult = await Promise.race([firstChunkPromise, firstTimeout]);
            if (!firstResult.done && firstResult.value) {
              successfulModelName = modelName;
              activeIterator = iterator;
              firstActiveChunk = firstResult.value;
              break;
            }
          }
        } catch (streamErr: any) {
          const errMessage = streamErr?.message || String(streamErr);
          const isQuota = errMessage.includes("429") || errMessage.includes("RESOURCE_EXHAUSTED");
          const isHighDemand = errMessage.includes("503") || errMessage.includes("UNAVAILABLE");

          if (isQuota) {
            setModelCooldown(modelName, 60000);
            continue;
          }
          if (isHighDemand) {
            setModelCooldown(modelName, 30000);
            continue;
          }

          // Try direct generateContent as rapid backup
          try {
            const directPromise = ai.models.generateContent({
              model: modelName,
              contents,
              config: modelConfig
            });
            const directTimeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Direct generation timeout")), 8000)
            );
            const directRes: any = await Promise.race([directPromise, directTimeout]);
            if (directRes && directRes.text) {
              successfulModelName = modelName;
              directGeneratedText = directRes.text;
              break;
            }
          } catch (directErr: any) {
            const dErrMessage = directErr?.message || String(directErr);
            if (dErrMessage.includes("429") || dErrMessage.includes("RESOURCE_EXHAUSTED")) {
              setModelCooldown(modelName, 60000);
            }
          }
        }
      }

      if (firstActiveChunk || directGeneratedText) {
        let hasEmittedMeta = false;
        const streamedChunks: string[] = [];
        let fullStreamedText = "";

        try {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
          }

          const inputTokensEst = Math.ceil((systemInstruction.length + message.length + JSON.stringify(history || []).length) / 3.8);
          const initialGeminiMeta = {
            engine: "gemini",
            model: successfulModelName,
            inputTokens: inputTokensEst,
            outputTokens: 0,
            tokensUsed: inputTokensEst,
            tokensAvailable: (1000000 - inputTokensEst).toLocaleString(),
            contextLimit: 1000000
          };
          res.write(`data: ${JSON.stringify({ meta: initialGeminiMeta })}\n\n`);
          hasEmittedMeta = true;

          if (firstActiveChunk && activeIterator) {
            if (firstActiveChunk.text) {
              streamedChunks.push(firstActiveChunk.text);
              fullStreamedText += firstActiveChunk.text;
              res.write(`data: ${JSON.stringify({ text: firstActiveChunk.text })}\n\n`);
            }

            let nextResult = await activeIterator.next();
            while (!nextResult.done) {
              const chunk = nextResult.value;
              if (chunk?.text) {
                streamedChunks.push(chunk.text);
                fullStreamedText += chunk.text;
                res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
              }
              nextResult = await activeIterator.next();
            }
          } else if (directGeneratedText) {
            fullStreamedText = directGeneratedText;
            const words = directGeneratedText.match(/(\S+\s*|\s+)/g) || [directGeneratedText];
            for (const word of words) {
              streamedChunks.push(word);
              res.write(`data: ${JSON.stringify({ text: word })}\n\n`);
              await new Promise(resolve => setTimeout(resolve, 8));
            }
          }

          if (fullStreamedText.trim()) {
            const inputTokensEst = Math.ceil((systemInstruction.length + message.length + JSON.stringify(history || []).length) / 3.8);
            const outputTokensEst = Math.ceil(fullStreamedText.length / 3.8);
            const totalTokensUsed = inputTokensEst + outputTokensEst;
            const finalGeminiMeta = {
              engine: "gemini",
              model: successfulModelName,
              inputTokens: inputTokensEst,
              outputTokens: outputTokensEst,
              tokensUsed: totalTokensUsed,
              tokensAvailable: (1000000 - totalTokensUsed).toLocaleString(),
              contextLimit: 1000000
            };
            res.write(`data: ${JSON.stringify({ meta: finalGeminiMeta })}\n\n`);

            res.write('data: [DONE]\n\n');
            res.end();
            streamedSuccessfully = true;
            assistantStats.geminiSuccesses++;

            // Calculate real API costs based on model rate tier in CAD
            const isLite = successfulModelName.includes('lite');
            const inputRateCad = isLite ? CAD_RATES.LITE_INPUT_PER_1M : CAD_RATES.FLASH_INPUT_PER_1M;
            const outputRateCad = isLite ? CAD_RATES.LITE_OUTPUT_PER_1M : CAD_RATES.FLASH_OUTPUT_PER_1M;
            const costCad = Number(((inputTokensEst * inputRateCad + outputTokensEst * outputRateCad) / 1000000).toFixed(6));
            const costUsd = Number((costCad / USD_TO_CAD).toFixed(6));

            // Record Gemini Event Telemetry
            recordAiEvent({
              message_preview: sanitizedMessage,
              response_preview: fullStreamedText.slice(0, 300),
              engine: 'gemini',
              model: successfulModelName,
              input_tokens: inputTokensEst,
              output_tokens: outputTokensEst,
              total_tokens: totalTokensUsed,
              cost_cad: costCad,
              cost_saved_cad: 0,
              cost_usd: costUsd,
              cost_saved_usd: 0,
              latency_ms: Date.now() - startChatTime,
              is_cache_hit: false,
              security_flag: secAnalysis.flag,
              threat_category: secAnalysis.threatCategory,
              threat_score: secAnalysis.threatScore,
              guardrail_triggered: false,
              language: lang,
              recruiter_mode: !!recruiterMode,
              fallback_triggered: false
            });

            // Store response in semantic cache for instant reuse
            globalSemanticCache.store(sanitizedMessage, lang, !!recruiterMode, fullStreamedText, streamedChunks, finalGeminiMeta);
          }
        } catch (streamIterErr: any) {
          console.log("[Aegis Intelligence] Gemini stream iteration failed. Switching to Aegis RAG Engine:", streamIterErr?.message || streamIterErr);
          streamedSuccessfully = false;
        }
      } else {
        console.log("[Aegis Intelligence] All Gemini models currently busy or exhausted. Falling back to local RAG Engine.");
        assistantStats.fallbackCount++;
      }

    } catch (geminiError: any) {
      console.log("[Aegis Intelligence] Gemini API unavailable. Activating Aegis Local RAG Fallback:", geminiError?.message || geminiError);
      streamedSuccessfully = false;
      assistantStats.fallbackCount++;
    }

    // If streaming failed (e.g. 429 quota exhaustion or missing key), run local RAG fallback
    if (!streamedSuccessfully) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
      }

      // Generate high-fidelity RAG response based on local search scored relevant items
      const generateFallbackResponse = (
        msg: string,
        items: any[],
        languageCode: 'en' | 'fr',
        isRecruiter: boolean
      ): string => {
        const isEn = languageCode === 'en';
        const lowerQuery = msg.toLowerCase();

        // Greetings & Identity Queries
        if (expandedQuery.intents.isGreeting || expandedQuery.intents.isAegisIdentity) {
          if (isRecruiter) {
            return isEn
              ? "Hello! I am Angesh Chanderdip, a Cybersecurity Engineer specializing in Network Access Control (NAC), Cisco ISE, SIEM threat detection, and Active Directory security. Feel free to explore my background or download my resume below!\n\n[ACTION: download_resume:en] [ACTION: open_contact]"
              : "Bonjour ! Je suis Angesh Chanderdip, un ingénieur en cybersécurité spécialisé dans le contrôle d'accès réseau (NAC), Cisco ISE et la détection SIEM. N'hésitez pas à explorer mon parcours ou à télécharger mon CV ci-dessous !\n\n[ACTION: download_resume:fr] [ACTION: open_contact]";
          } else {
            return isEn
              ? "Greetings! I am **Aegis**, Angesh Chanderdip's AI Security Analyst & Portfolio Intelligence Assistant. I am trained directly on Angesh's verified ground-truth portfolio data. How can I assist you today?"
              : "Bonjour ! Je suis **Aegis**, l'analyste de sécurité IA et l'unité d'intelligence du portfolio d'Angesh Chanderdip. Comment puis-je vous aider aujourd'hui ?";
          }
        }

        if (expandedQuery.intents.isAngeshIdentity) {
          return isEn
            ? "Angesh Chanderdip is a Cybersecurity Engineer specializing in Network Access Control (NAC), Cisco ISE, 802.1X, Active Directory, and SIEM threat detection (Wazuh, Sysmon, Suricata). He holds an M.Sc. in Cybersecurity from University College Dublin, BTL1, and CompTIA Security+ certifications, with professional engineering experience at General Motors and GTECHNA.\n\n[ACTION: navigate:/#about] [ACTION: download_resume:en]"
            : "Angesh Chanderdip est un ingénieur en cybersécurité spécialisé dans le contrôle d'accès réseau (NAC), Cisco ISE, 802.1X, Active Directory et la détection SIEM (Wazuh). Titulaire d'un Master de l'University College Dublin, de certifications BTL1 et CompTIA Security+, il a travaillé chez General Motors et GTECHNA.\n\n[ACTION: navigate:/#about] [ACTION: download_resume:fr]";
        }

        // Talent & Skills Query
        const isTalentOrSkill = lowerQuery.includes('talent') || 
                                lowerQuery.includes('skill') || 
                                lowerQuery.includes('strength') || 
                                lowerQuery.includes('specialt') || 
                                lowerQuery.includes('expertise') || 
                                lowerQuery.includes('compétence') || 
                                lowerQuery.includes('fort');

        if (isTalentOrSkill) {
          if (isRecruiter) {
            return isEn
              ? "My key technical talents and core engineering strengths include:\n\n• **Network Access Control (NAC)**: Expertise with Cisco ISE, 802.1X EAP-TLS protocols, and Zero Trust architectures.\n• **SIEM & Threat Detection**: Hands-on log analysis and rule engineering with Wazuh, Sysmon, and Suricata.\n• **Security Automation**: Custom workflow automation using Python, PowerShell, and REST APIs.\n• **Active Directory & Infrastructure**: Identity security, LDAP, PKI/DigiCert integration, and enterprise Linux/Windows administration.\n\n[ACTION: navigate:/#about] [ACTION: download_resume:en]"
              : "Mes compétences clés et expertises techniques comprennent :\n\n• **Contrôle d'accès réseau (NAC)** : Maîtrise de Cisco ISE, protocoles 802.1X EAP-TLS et architectures Zero Trust.\n• **SIEM & Détection de menaces** : Analyse de logs et création de règles sur Wazuh, Sysmon et Suricata.\n• **Automatisation Sécurité** : Scripting Python, PowerShell et intégration d'APIs REST.\n• **Active Directory & Infrastructures** : Sécurité des identités, PKI/DigiCert et administration Linux/Windows.\n\n[ACTION: navigate:/#about] [ACTION: download_resume:fr]";
          } else {
            return isEn
              ? "Angesh Chanderdip's key technical talents and engineering strengths include:\n\n• **Network Access Control (NAC)**: Deep expertise in Cisco ISE, 802.1X EAP-TLS, and Zero Trust network deployments.\n• **SIEM & Threat Detection**: Security log analysis and rule building using Wazuh, Sysmon, and Suricata.\n• **Security Automation**: Custom Python and PowerShell automation for PKI/DigiCert and Active Directory.\n• **Enterprise Infrastructure**: Active Directory identity security, SQL Server/PostgreSQL, and Linux administration.\n\n[ACTION: navigate:/#about] [ACTION: download_resume:en]"
              : "Les compétences clés et talents d'Angesh Chanderdip comprennent :\n\n• **Contrôle d'accès réseau (NAC)** : Expertise approfondie sur Cisco ISE, 802.1X EAP-TLS et Zero Trust.\n• **SIEM & Détection de menaces** : Analyse de logs et règles de détection sur Wazuh, Sysmon et Suricata.\n• **Automatisation Sécurité** : Scripts Python et PowerShell pour PKI/DigiCert et Active Directory.\n• **Infrastructures Entreprise** : Sécurité Active Directory, SQL Server/PostgreSQL et administration Linux.\n\n[ACTION: navigate:/#about] [ACTION: download_resume:fr]";
          }
        }

        // Resume query
        const wantsResume = lowerQuery.includes('cv') || lowerQuery.includes('resume') || lowerQuery.includes('curriculum') || lowerQuery.includes('télécharger') || lowerQuery.includes('download');
        if (wantsResume) {
          if (isEn) {
            return "You can download Angesh Chanderdip's official resume directly using the button below. It details his engineering roles at General Motors and GTECHNA, along with his Cisco ISE and CompTIA Security+ / BTL1 certifications.\n\n[ACTION: download_resume:en]";
          } else {
            return "Vous pouvez télécharger le CV officiel d'Angesh Chanderdip directement ci-dessous. Il détaille ses postes chez General Motors et GTECHNA, ainsi que ses certifications Cisco ISE, CompTIA Security+ et BTL1.\n\n[ACTION: download_resume:fr]";
          }
        }

        // Why Hire query
        const isWhyHireQuery = lowerQuery.includes('why hire') || 
                               lowerQuery.includes('why should') || 
                               lowerQuery.includes('why choose') || 
                               lowerQuery.includes('pourquoi embaucher') || 
                               lowerQuery.includes('pourquoi choisir') ||
                               (lowerQuery.includes('hire') && (lowerQuery.includes('why') || lowerQuery.includes('should') || lowerQuery.includes('reason') || lowerQuery.includes('angesh')));

        if (isWhyHireQuery) {
          return isEn
            ? "Here is why Angesh Chanderdip is an outstanding candidate:\n\n1. **Fortune 500 Security Experience**: Endpoint Security & Network Access Control Engineer at General Motors, managing 300+ Cisco ISE security nodes and automating PKI/AD workflows.\n2. **Core Specializations**: Network Access Control (Cisco ISE), SIEM threat detection (Wazuh, Sysmon), Active Directory, and incident response.\n3. **Certified Professional**: M.Sc. in Cybersecurity (UCD), Blue Team Level 1 (BTL1), CompTIA Security+, and Cisco credentials.\n4. **Bilingual Support**: Proven track record at GTECHNA delivering PostgreSQL/SQL Server technical support in English and French.\n\n[ACTION: download_resume:en] [ACTION: open_contact]"
            : "Voici pourquoi Angesh Chanderdip est un excellent candidat :\n\n1. **Expérience Sécurité Fortune 500** : Ingénieur NAC chez General Motors (300+ nœuds Cisco ISE, automatisation PKI/AD).\n2. **Spécialisations Clés** : Contrôle d'accès réseau (Cisco ISE), détection SIEM (Wazuh) et sécurité Active Directory.\n3. **Diplômes & Certifications** : Master en Cybersécurité (UCD), BTL1, CompTIA Security+ et Cisco.\n4. **Support Bilingue** : Expérience chez GTECHNA en support SQL/PostgreSQL en français et anglais.\n\n[ACTION: download_resume:fr] [ACTION: open_contact]";
        }

        // Contact query
        const wantsContact = lowerQuery.includes('contact') || lowerQuery.includes('email') || lowerQuery.includes('reach') || lowerQuery.includes('contacter') || lowerQuery.includes('joindre');
        if (wantsContact) {
          if (isEn) {
            return "You can reach out to Angesh directly via email at **angesh021@gmail.com** or send a message through the interactive contact form below.\n\n[ACTION: open_contact]";
          } else {
            return "Vous pouvez contacter Angesh directement par email à **angesh021@gmail.com** ou lui envoyer un message via le formulaire de contact ci-dessous.\n\n[ACTION: open_contact]";
          }
        }

        // Matched knowledge item - Clean and format nicely without raw markdown clutter
        if (items.length > 0) {
          const item = items[0];
          let cleanText = item.content || "";

          // Format Q&A item if present
          const answerIdx = cleanText.indexOf("Answer:");
          if (answerIdx !== -1) {
            cleanText = cleanText.slice(answerIdx + 7).trim();
          } else {
            const reponseIdx = cleanText.indexOf("Réponse:");
            if (reponseIdx !== -1) {
              cleanText = cleanText.slice(reponseIdx + 8).trim();
            }
          }

          // Strip raw database field prefixes & hashes
          cleanText = cleanText
            .replace(/###\s*/g, '')
            .replace(/^Certification Name:\s*/gm, '')
            .replace(/^Issuer:\s*/gm, 'Issued by: ')
            .replace(/^Date:\s*/gm, 'Date: ')
            .replace(/^Verification \/ Badge URL:\s*https?:\/\/\S+/gm, '')
            .replace(/^Skills Gained:\s*/gm, 'Skills: ')
            .replace(/^Key Benefits:\s*/gm, 'Key Highlights:\n')
            .replace(/^Role:\s*/gm, 'Role: ')
            .replace(/^Company:\s*/gm, 'Company: ')
            .replace(/^Period:\s*/gm, 'Period: ')
            .replace(/^Location:\s*/gm, 'Location: ')
            .replace(/^Key Technologies & Skills:\s*/gm, 'Technologies: ')
            .replace(/^Impact Metrics:\s*/gm, 'Impact: ')
            .replace(/^Responsibilities & Achievements:\s*/gm, 'Responsibilities:\n')
            .trim();

          if (isRecruiter) {
            cleanText = cleanText
              .replace(/\bAngesh Chanderdip\b/g, "I")
              .replace(/\bAngesh's\b/gi, "my")
              .replace(/\bAngesh\b/g, "I")
              .replace(/\bhis\b/g, "my")
              .replace(/\bhim\b/g, "me")
              .replace(/\bhe is\b/gi, "I am")
              .replace(/\bhe has\b/gi, "I have")
              .replace(/\bhe specializes\b/gi, "I specialize");
          }

          let response = `**${item.title}**\n\n${cleanText}\n\n`;

          if (item.projectSlug) {
            response += `[ACTION: open_project:${item.projectSlug}] `;
          }
          if (item.sectionId) {
            response += `[ACTION: navigate:/#${item.sectionId}] `;
          }
          return response.trim();
        } else {
          // General Fallback
          if (isRecruiter) {
            return isEn
              ? "I am Angesh Chanderdip, a Cybersecurity Engineer specializing in Network Access Control (NAC), Cisco ISE, endpoint security, and SIEM detection engineering. How can I assist you today?\n\n[ACTION: download_resume:en] [ACTION: open_contact]"
              : "Je suis Angesh Chanderdip, un ingénieur en cybersécurité spécialisé dans le contrôle d'accès réseau (NAC), Cisco ISE et l'ingénierie de détection SIEM. Comment puis-je vous aider aujourd'hui ?\n\n[ACTION: download_resume:fr] [ACTION: open_contact]";
          } else {
            return isEn
              ? "Angesh Chanderdip is a Cybersecurity Engineer specializing in Network Access Control (NAC), Cisco ISE, SIEM threat detection, and Active Directory security. How can Aegis assist you with his portfolio today?\n\n[ACTION: download_resume:en] [ACTION: open_contact]"
              : "Angesh Chanderdip est un ingénieur en cybersécurité spécialisé dans le contrôle d'accès réseau (NAC), Cisco ISE et la sécurité des systèmes SIEM. Comment Aegis peut-il vous aider aujourd'hui ?\n\n[ACTION: download_resume:fr] [ACTION: open_contact]";
          }
        }
      };

      const ragMeta = {
        engine: "rag",
        matchPercentage: rehydrated.topMatchPercentage,
        vectorScore: rehydrated.topVectorScore,
        topSource: rehydrated.topSourceTitle,
        totalMatches: rehydrated.totalMatches
      };

      res.write(`data: ${JSON.stringify({ meta: ragMeta })}\n\n`);

      const fallbackText = generateFallbackResponse(message, relevantItems, lang, recruiterMode);

      // Stream back local fallback response
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const chunkSize = 15;
      const fallbackChunks: string[] = [];

      for (let i = 0; i < fallbackText.length; i += chunkSize) {
        const chunk = fallbackText.slice(i, i + chunkSize);
        fallbackChunks.push(chunk);
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        await delay(12);
      }

      res.write('data: [DONE]\n\n');
      res.end();

      // Record Aegis Local RAG Fallback Telemetry Event
      const ragInputTokens = Math.ceil((systemInstruction.length + sanitizedMessage.length) / 3.8);
      const ragOutputTokens = Math.ceil(fallbackText.length / 3.8);
      const ragTotalTokens = ragInputTokens + ragOutputTokens;
      const ragCostSavedCad = Number(((ragTotalTokens / 1000000) * CAD_RATES.RAG_SAVED_PER_1M).toFixed(6));
      const ragCostSavedUsd = Number((ragCostSavedCad / USD_TO_CAD).toFixed(6));

      recordAiEvent({
        message_preview: sanitizedMessage,
        response_preview: fallbackText.slice(0, 300),
        engine: 'rag',
        model: 'aegis-rag-engine',
        input_tokens: ragInputTokens,
        output_tokens: ragOutputTokens,
        total_tokens: ragTotalTokens,
        cost_cad: 0,
        cost_saved_cad: ragCostSavedCad,
        cost_usd: 0,
        cost_saved_usd: ragCostSavedUsd,
        latency_ms: Date.now() - startChatTime,
        is_cache_hit: false,
        security_flag: secAnalysis.flag,
        threat_category: secAnalysis.threatCategory,
        threat_score: secAnalysis.threatScore,
        guardrail_triggered: false,
        language: lang,
        recruiter_mode: !!recruiterMode,
        fallback_triggered: true
      });

      // Cache the fallback response in semantic cache for instant response on repeat queries
      if (fallbackText.trim()) {
        globalSemanticCache.store(sanitizedMessage, lang, !!recruiterMode, fallbackText, fallbackChunks, ragMeta);
      }
    }

  } catch (error: any) {
    console.error("Assistant Chat Exception:", error);
    try {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
      }
      const isFrMsg = lang === 'fr';
      const fallbackText = isFrMsg 
        ? "J'ai consulté la base de connaissances locale d'Angesh. Le service d'intelligence cloud rencontre actuellement une forte demande, mais je peux vous confirmer qu'Angesh est un **Ingénieur en Cybersécurité** expert en **Contrôle d'Accès Réseau (NAC)** et **Cisco ISE**.\n\n- **Certifications** : CompTIA Security+ & Blue Team Level 1 (BTL1).\n- **Projets Phares** : SOC Lab virtuel avec Wazuh, plateforme Aura, et infrastructures NAC.\n- **Préavis** : Préavis négociable de 2 à 4 semaines.\n\nVous pouvez télécharger son CV ou le contacter directement ci-dessous :\n[ACTION: download_resume:fr] [ACTION: open_contact] [ACTION: navigate:/#projects]"
        : "I have scanned Angesh's verified portfolio records. The cloud intelligence service is currently experiencing high demand, but I can share that Angesh is a highly skilled **Cybersecurity Engineer** specializing in **Network Access Control (NAC)** and **Cisco ISE** deployment.\n\n- **Certifications**: CompTIA Security+ and Blue Team Level 1 (BTL1).\n- **Key Projects**: Virtual SIEM SOC Lab and Enterprise NAC Security Automation labs.\n- **Availability**: Standard notice is negotiable (2-4 weeks).\n\nFeel free to explore his projects, download his resume, or message him directly:\n[ACTION: download_resume:en] [ACTION: open_contact] [ACTION: navigate:/#projects]";

      res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

      // Record emergency fallback event in CAD
      const emgOut = Math.ceil(fallbackText.length / 3.8);
      const emgSavedCad = Number((((150 + emgOut) / 1000000) * CAD_RATES.RAG_SAVED_PER_1M).toFixed(6));

      recordAiEvent({
        message_preview: (req.body?.message || '').slice(0, 255),
        response_preview: fallbackText.slice(0, 300),
        engine: 'rag',
        model: 'aegis-emergency-fallback',
        input_tokens: 150,
        output_tokens: emgOut,
        total_tokens: 150 + emgOut,
        cost_cad: 0,
        cost_saved_cad: emgSavedCad,
        cost_usd: 0,
        cost_saved_usd: Number((emgSavedCad / USD_TO_CAD).toFixed(6)),
        latency_ms: Date.now() - startChatTime,
        is_cache_hit: false,
        security_flag: 'safe',
        threat_score: 0,
        guardrail_triggered: false,
        language: lang,
        recruiter_mode: !!req.body?.recruiterMode,
        fallback_triggered: true
      });
    } catch (err) {
      console.error("Critical stream error handling fallback:", err);
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
});

// ============================================================================
// Text-to-Speech (TTS) Endpoint with High-Fidelity Audio Streaming & In-Memory Cache
// ============================================================================
const ttsCache = new Map<string, { audio: string; mimeType: string; voice: string }>();
const MAX_TTS_CACHE_ENTRIES = 100;

async function fetchGoogleTTSChunk(text: string, lang: string = 'en'): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) {
    throw new Error(`TTS upstream returned status ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function generateTTSAudio(text: string, lang: string = 'en'): Promise<Buffer> {
  // Split into natural sentences / phrases <= 160 characters
  const rawSentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    if ((currentChunk + ' ' + sentence).length > 160) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  // Limit to max 4 chunks (~450 chars) for responsive response
  const selectedChunks = chunks.slice(0, 4);
  const audioBuffers: Buffer[] = [];

  for (const chunk of selectedChunks) {
    if (chunk.trim().length > 0) {
      const buf = await fetchGoogleTTSChunk(chunk, lang);
      audioBuffers.push(buf);
    }
  }

  return Buffer.concat(audioBuffers);
}

router.post(['/tts', '/api/portfolio-assistant/tts', '/api/assistant/tts'], async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Aoede', language = 'en' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Sanitize text: strip markdown bold, headers, list bullets, action tags, emojis, and code
    let cleanedText = text
      .replace(/\[ACTION:[^\]]+\]/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s*/g, '')
      .replace(/^[\s*-]+/gm, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '') // strip emojis & weird symbols
      .trim();

    if (!cleanedText) {
      return res.status(400).json({ error: 'Cleaned text is empty' });
    }

    // Optimize text length: take the first ~350 characters for clear, punchy vocal delivery
    if (cleanedText.length > 380) {
      const lastPeriod = cleanedText.lastIndexOf('.', 360);
      if (lastPeriod > 120) {
        cleanedText = cleanedText.substring(0, lastPeriod + 1);
      } else {
        cleanedText = cleanedText.substring(0, 360) + '...';
      }
    }

    const langCode = (language && language.toLowerCase().startsWith('fr')) ? 'fr' : 'en';
    const cacheKey = `${langCode}:${cleanedText}`;

    if (ttsCache.has(cacheKey)) {
      return res.json(ttsCache.get(cacheKey));
    }

    // Generate real audio MP3 buffer
    const audioBuffer = await generateTTSAudio(cleanedText, langCode);

    const result = {
      audio: audioBuffer.toString('base64'),
      mimeType: 'audio/mpeg',
      voice: voiceName || 'Aoede',
      language: langCode
    };

    // Cache result
    if (ttsCache.size >= MAX_TTS_CACHE_ENTRIES) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) ttsCache.delete(firstKey);
    }
    ttsCache.set(cacheKey, result);

    return res.json(result);
  } catch (error: any) {
    console.error('TTS Generation error:', error?.message || error);
    return res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

export default router;
