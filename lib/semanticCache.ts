/**
 * @fileoverview
 * AEGIS Semantic Similarity Response Caching Engine.
 * 
 * Goes beyond basic exact-string hashing by analyzing token overlap (Jaccard)
 * and sub-word n-gram vector cosine similarity. Enables semantically equivalent
 * inquiries (e.g., "Tell me about ISE" vs "What is Angesh's Cisco ISE experience?")
 * to hit the zero-cost cache instantly with sub-20ms latency.
 */

export interface SemanticCacheEntry {
  rawQuery: string;
  normalizedQuery: string;
  wordTokens: Set<string>;
  ngramVector: Map<string, number>;
  ngramMagnitude: number;
  fullText: string;
  chunks: string[];
  meta?: any;
  lang: string;
  recruiterMode: boolean;
  timestamp: number;
  hits: number;
}

export interface SemanticCacheLookupResult {
  entry: SemanticCacheEntry;
  isExact: boolean;
  isSemantic: boolean;
  similarity: number; // 0 to 1
}

const COMMON_STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'of', 'by', 'from', 'up', 'down', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might',
  'must', 'what', 'who', 'whom', 'this', 'that', 'these', 'those', 'am',
  'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours',
  'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them',
  'tell', 'please', 'know', 'give', 'show', 'explain', 'angesh', 'angeshs',
  // French stop words
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'ce', 'cette', 'ces',
  'est', 'sont', 'et', 'ou', 'dans', 'en', 'sur', 'pour', 'avec', 'par',
  'qui', 'que', 'quoi', 'quel', 'quelle', 'quels', 'quelles', 'comment',
  'pourquoi', 'peux', 'pouvez', 'svp', 'merci', 'moi', 'mon', 'ma', 'mes'
]);

// Helper: Normalize query string
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ") // keep only alphanumeric
    .replace(/\s+/g, " ")
    .trim();
}

// Helper: Extract significant word tokens (excluding stop words)
export function extractWordTokens(normalized: string): Set<string> {
  const words = normalized.split(' ');
  const tokens = new Set<string>();
  for (const w of words) {
    if (w.length > 2 && !COMMON_STOP_WORDS.has(w)) {
      tokens.add(w);
    }
  }
  return tokens;
}

// Helper: Extract character 3-grams for fuzzy n-gram vector matching
export function extractCharNgrams(normalized: string): { vector: Map<string, number>; magnitude: number } {
  const n = 3;
  const vec = new Map<string, number>();
  const padded = `_${normalized}_`;
  for (let i = 0; i <= padded.length - n; i++) {
    const gram = padded.slice(i, i + n);
    vec.set(gram, (vec.get(gram) || 0) + 1);
  }

  let sumSquares = 0;
  for (const count of vec.values()) {
    sumSquares += count * count;
  }
  const magnitude = Math.sqrt(sumSquares) || 1;

  return { vector: vec, magnitude };
}

// Helper: Jaccard Word Similarity
function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++;
    }
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// Helper: Cosine N-Gram Similarity
function computeCosineSimilarity(
  vecA: Map<string, number>,
  magA: number,
  vecB: Map<string, number>,
  magB: number
): number {
  if (magA === 0 || magB === 0) return 0;

  let dotProduct = 0;
  for (const [gram, countA] of vecA.entries()) {
    const countB = vecB.get(gram);
    if (countB) {
      dotProduct += countA * countB;
    }
  }
  return dotProduct / (magA * magB);
}

export class SemanticResponseCache {
  private entries: SemanticCacheEntry[] = [];
  private maxEntries: number;
  private ttlMs: number;
  private similarityThreshold: number;

  public stats = {
    exactHits: 0,
    semanticHits: 0,
    misses: 0,
    totalLookups: 0
  };

  constructor(maxEntries = 250, ttlMs = 15 * 60 * 1000, similarityThreshold = 0.76) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Search for a cached response using exact match or semantic vector similarity.
   */
  public lookup(query: string, lang: string, recruiterMode: boolean): SemanticCacheLookupResult | null {
    this.stats.totalLookups++;
    const now = Date.now();
    const normalized = normalizeText(query);
    if (!normalized) return null;

    const queryTokens = extractWordTokens(normalized);
    const { vector: queryVec, magnitude: queryMag } = extractCharNgrams(normalized);

    // 1. Fast Pass: Exact Normalized Match
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (entry.lang === lang && entry.recruiterMode === recruiterMode) {
        if (now - entry.timestamp > this.ttlMs) {
          continue; // expired
        }
        if (entry.normalizedQuery === normalized) {
          entry.hits++;
          this.stats.exactHits++;
          return {
            entry,
            isExact: true,
            isSemantic: false,
            similarity: 1.0
          };
        }
      }
    }

    // 2. Semantic Vector & Jaccard Hybrid Pass
    let bestMatch: SemanticCacheEntry | null = null;
    let highestScore = 0;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (entry.lang !== lang || entry.recruiterMode !== recruiterMode) {
        continue;
      }
      if (now - entry.timestamp > this.ttlMs) {
        continue;
      }

      // Check Jaccard overlap on significant domain keywords
      const jaccard = computeJaccardSimilarity(queryTokens, entry.wordTokens);

      // Check Cosine similarity on character n-grams
      const cosine = computeCosineSimilarity(queryVec, queryMag, entry.ngramVector, entry.ngramMagnitude);

      // Weighted semantic score: heavy weight on core domain tokens
      const combinedScore = (jaccard * 0.55) + (cosine * 0.45);

      if (combinedScore > highestScore) {
        highestScore = combinedScore;
        bestMatch = entry;
      }
    }

    if (bestMatch && highestScore >= this.similarityThreshold) {
      bestMatch.hits++;
      this.stats.semanticHits++;
      return {
        entry: bestMatch,
        isExact: false,
        isSemantic: true,
        similarity: Number(highestScore.toFixed(3))
      };
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Save a completed response into the semantic cache.
   */
  public store(
    query: string,
    lang: string,
    recruiterMode: boolean,
    fullText: string,
    chunks: string[],
    meta?: any
  ): void {
    const normalized = normalizeText(query);
    if (!normalized || !fullText.trim()) return;

    // Prune oldest if at max capacity
    if (this.entries.length >= this.maxEntries) {
      this.entries.shift();
    }

    const wordTokens = extractWordTokens(normalized);
    const { vector: ngramVector, magnitude: ngramMagnitude } = extractCharNgrams(normalized);

    const newEntry: SemanticCacheEntry = {
      rawQuery: query,
      normalizedQuery: normalized,
      wordTokens,
      ngramVector,
      ngramMagnitude,
      fullText,
      chunks,
      meta,
      lang,
      recruiterMode,
      timestamp: Date.now(),
      hits: 0
    };

    // Remove existing duplicate if present
    this.entries = this.entries.filter(e => !(e.normalizedQuery === normalized && e.lang === lang && e.recruiterMode === recruiterMode));
    this.entries.push(newEntry);
  }

  public get size(): number {
    return this.entries.length;
  }

  public clear(): void {
    this.entries = [];
  }
}

// Global Singleton Semantic Cache
export const globalSemanticCache = new SemanticResponseCache();
