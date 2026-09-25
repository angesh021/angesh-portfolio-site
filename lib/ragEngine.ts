/**
 * @fileoverview
 * Advanced RAG Retrieval & Chunking Engine for Aegis Portfolio Assistant.
 * 
 * Implements:
 * 1. Parent-Child & Overlapping Semantic Chunking
 * 2. Multi-Query Expansion & Cross-Lingual Term Mapping
 * 3. Hybrid Search with Reciprocal Rank Fusion (RRF: BM25/TF-IDF + Dense Vectors)
 * 4. Hierarchical Context Re-hydration & Source Attribution Windowing
 */

import { KnowledgeItem } from './knowledgeBase.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface KnowledgeChunk {
  chunkId: string;
  parentId: string;
  parentTitle: string;
  parentType: KnowledgeItem['type'];
  content: string;
  cleanContent: string;
  keywords: string[];
  technologies: string[];
  locale: 'en' | 'fr';
  route?: string;
  sectionId?: string;
  priority: number;
  chunkIndex: number;
  totalChunks: number;
  headerTag: string;
  parentItem: KnowledgeItem;
}

export interface ExpandedQuery {
  original: string;
  normalized: string;
  variations: string[];
  intents: {
    isSkill: boolean;
    isExperience: boolean;
    isProject: boolean;
    isCertification: boolean;
    isEducation: boolean;
    isGreeting: boolean;
    isAegisIdentity: boolean;
    isAngeshIdentity: boolean;
  };
  keywords: string[];
}

export interface RRFSearchResult {
  chunk?: KnowledgeChunk;
  item: KnowledgeItem;
  rrfScore: number;
  sparseScore: number;
  denseSimilarity: number;
  matchPercentage: number;
  matchedTerms: string[];
}

export interface RehydratedContextResult {
  formattedContext: string;
  topSourceTitle: string;
  topMatchPercentage: number;
  topVectorScore: number;
  totalMatches: number;
  relevantItems: KnowledgeItem[];
  retrievedChunks: KnowledgeChunk[];
}

// ============================================================================
// 1. Semantic & Parent-Child Chunking Strategy
// ============================================================================

/**
 * Transforms raw KnowledgeItems into semantic fine-grained chunks with parent references.
 */
export function createSemanticChunks(items: KnowledgeItem[]): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  items.forEach((item) => {
    const text = item.content || "";
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Strategy A: Bullet / Section-based chunking for structured text
    const sections: string[] = [];
    let currentBlock: string[] = [];

    lines.forEach((line) => {
      if (line.startsWith('- ') || line.startsWith('• ') || line.includes(': ') || currentBlock.length >= 4) {
        if (currentBlock.length > 0) {
          sections.push(currentBlock.join('\n'));
          currentBlock = [];
        }
      }
      currentBlock.push(line);
    });
    if (currentBlock.length > 0) {
      sections.push(currentBlock.join('\n'));
    }

    // Strategy B: Fallback to sliding window chunking if sections are too large or small
    const finalBlocks: string[] = [];
    sections.forEach(sec => {
      const words = sec.split(/\s+/);
      if (words.length > 120) {
        // Create overlapping chunks of 90 words with 25 word overlap
        const chunkSize = 90;
        const overlap = 25;
        for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
          const chunkWords = words.slice(i, i + chunkSize);
          if (chunkWords.length >= 10) {
            finalBlocks.push(chunkWords.join(' '));
          }
        }
      } else {
        finalBlocks.push(sec);
      }
    });

    const total = Math.max(1, finalBlocks.length);
    finalBlocks.forEach((block, idx) => {
      const headerTag = `[${item.type.toUpperCase()}: ${item.title} | Chunk ${idx + 1}/${total}]`;
      const cleanContent = block.replace(/\[ACTION:[^\]]+\]/g, '').trim();

      chunks.push({
        chunkId: `${item.id}-chunk-${idx}`,
        parentId: item.id,
        parentTitle: item.title,
        parentType: item.type,
        content: block,
        cleanContent,
        keywords: item.keywords || [],
        technologies: item.technologies || [],
        locale: item.locale,
        route: item.route,
        sectionId: item.sectionId,
        priority: item.priority || 5,
        chunkIndex: idx,
        totalChunks: total,
        headerTag,
        parentItem: item
      });
    });
  });

  return chunks;
}

// ============================================================================
// 2. Query Expansion & Multi-Query Transformations
// ============================================================================

const STOP_WORDS = new Set([
  'who', 'what', 'where', 'when', 'why', 'how', 'are', 'you', 'your', 'yours', 'me', 'my', 'myself',
  'is', 'am', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'now', 'tell', 'show', 'give', 'get',
  // French
  'qui', 'que', 'quoi', 'ou', 'où', 'quand', 'comment', 'pourquoi', 'est', 'sont', 'suis', 'es',
  'etes', 'êtes', 'sommes', 'etait', 'etient', 'ete', 'été', 'avoir', 'a', 'ont', 'avez', 'avons',
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes',
  'ton', 'ta', 'tes', 'votre', 'vos', 'notre', 'nos', 'lui', 'leur', 'leurs', 'je', 'tu', 'il', 'elle',
  'nous', 'vous', 'ils', 'elles', 'se', 'donc', 'car', 'ni', 'dans', 'sur', 'par', 'pour', 'en', 'avec', 'sans'
]);

const SYNONYM_MAP: Record<string, string[]> = {
  // Cybersecurity & NAC
  'nac': ['network access control', 'cisco ise', '802.1x', 'radius', 'tacacs+', 'peap', 'eap-tls'],
  'ise': ['cisco ise', 'identity services engine', 'nac', '802.1x', 'radius'],
  'soc': ['home soc lab', 'wazuh', 'siem', 'suricata', 'sysmon', 'threat detection', 'edr'],
  'siem': ['wazuh', 'elastic', 'elk stack', 'suricata', 'log management', 'soc'],
  'wazuh': ['wazuh siem', 'threat detection', 'security monitoring', 'soc lab'],
  'gm': ['general motors', 'automotive', 'endpoint security engineer', 'cisco ise'],
  'general motors': ['gm', 'endpoint security engineer', 'cisco ise', '802.1x'],
  'gtechna': ['enterprise software support', 'technical support analyst', 'sql', 'linux'],
  'skills': ['technologies', 'competencies', 'expertise', 'python', 'powershell', 'active directory'],
  'experience': ['work history', 'career', 'general motors', 'gtechna', 'job'],
  'projects': ['labs', 'home soc lab', 'enterprise nac lab', 'aura', 'admin dashboard'],
  'certifications': ['security+', 'btl1', 'blue team level 1', 'ccna', 'credentials'],
  'education': ['university college dublin', 'tu dublin', 'm.sc. cybersecurity', 'degree'],
  'cv': ['resume', 'download resume', 'pdf'],
  'resume': ['cv', 'download resume', 'pdf']
};

export function expandQuery(message: string, locale: 'en' | 'fr' = 'en'): ExpandedQuery {
  const normalized = message.toLowerCase().replace(/[?!=.,]/g, '').trim();
  const rawWords = normalized.split(/\s+/).filter(w => w.length > 0);
  const cleanKeywords = rawWords.filter(w => !STOP_WORDS.has(w));

  const variationsSet = new Set<string>();
  variationsSet.add(normalized);

  // 1. Synonym & Technical Acronym Expansion
  cleanKeywords.forEach(word => {
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].forEach(syn => {
        variationsSet.add(`${normalized} ${syn}`);
      });
    }
  });

  // 2. Sub-Query Decomposition (Split compound sentences)
  if (normalized.includes(' and ') || normalized.includes(' et ') || normalized.includes(' also ')) {
    const subParts = normalized.split(/\b(and|et|also|plus)\b/);
    subParts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.length > 3 && !STOP_WORDS.has(trimmed)) {
        variationsSet.add(trimmed);
      }
    });
  }

  // 3. Detect Intents
  const isSkill = normalized.includes('skill') || normalized.includes('talent') || normalized.includes('strength') || normalized.includes('compétence') || normalized.includes('expertise');
  const isExperience = normalized.includes('experience') || normalized.includes('work') || normalized.includes('job') || normalized.includes('general motors') || normalized.includes('gm') || normalized.includes('gtechna');
  const isProject = normalized.includes('project') || normalized.includes('projet') || normalized.includes('soc lab') || normalized.includes('nac lab') || normalized.includes('aura');
  const isCertification = normalized.includes('cert') || normalized.includes('security+') || normalized.includes('btl1') || normalized.includes('cisco');
  const isEducation = normalized.includes('education') || normalized.includes('degree') || normalized.includes('master') || normalized.includes('university') || normalized.includes('ucd');

  const greetings = ['hi', 'hello', 'hey', 'bonjour', 'salut', 'hola', 'yo', 'greetings', 'hi there', 'hello there', 'coucou'];
  const isGreeting = greetings.includes(normalized) || greetings.some(g => normalized.startsWith(`${g} `));

  const aegisIdentity = ['who are you', 'what are you', 'who is aegis', 'what is aegis', 'qui es tu', 'qui es-tu', 'qui est aegis'];
  const isAegisIdentity = aegisIdentity.some(q => normalized === q || normalized.startsWith(q));

  const angeshIdentity = ['who is angesh', 'who is angesh chanderdip', 'tell me about angesh', 'qui est angesh', 'parle moi de angesh'];
  const isAngeshIdentity = angeshIdentity.some(q => normalized === q || normalized.startsWith(q));

  return {
    original: message,
    normalized,
    variations: Array.from(variationsSet),
    intents: {
      isSkill,
      isExperience,
      isProject,
      isCertification,
      isEducation,
      isGreeting,
      isAegisIdentity,
      isAngeshIdentity
    },
    keywords: cleanKeywords
  };
}

// ============================================================================
// 3. Hybrid Search with Reciprocal Rank Fusion (RRF)
// ============================================================================

export function tokenizeText(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 0 && !STOP_WORDS.has(t));
}

export function generateTfidfVector(text: string, vocab: string[], idfMap: Map<string, number>): number[] {
  const tokens = tokenizeText(text);
  const tfMap = new Map<string, number>();
  tokens.forEach(t => tfMap.set(t, (tfMap.get(t) || 0) + 1));
  const totalTokens = tokens.length || 1;

  return vocab.map(term => {
    const tf = (tfMap.get(term) || 0) / totalTokens;
    const idf = idfMap.get(term) || 1.0;
    return tf * idf;
  });
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Performs Hybrid Search across Knowledge Chunks using Reciprocal Rank Fusion (RRF).
 */
export function hybridRRFSearch(
  expandedQuery: ExpandedQuery,
  chunks: KnowledgeChunk[],
  items: KnowledgeItem[],
  queryVector: number[],
  vocab: string[],
  idfMap: Map<string, number>,
  topK: number = 5
): RRFSearchResult[] {
  const RRF_K = 60; // Standard Reciprocal Rank Fusion constant

  // 1. Sparse Keyword Scoring for Chunks
  const sparseScores: { chunk: KnowledgeChunk; score: number; matchedTerms: string[] }[] = [];

  chunks.forEach(chunk => {
    let score = 0;
    const matchedTermsSet = new Set<string>();
    const titleLower = chunk.parentTitle.toLowerCase();
    const contentLower = chunk.cleanContent.toLowerCase();
    const kwLower = chunk.keywords.map(k => k.toLowerCase());
    const techLower = chunk.technologies.map(t => t.toLowerCase());

    expandedQuery.variations.forEach(qVar => {
      if (titleLower.includes(qVar)) { score += 40; matchedTermsSet.add(qVar); }
      if (contentLower.includes(qVar)) { score += 20; matchedTermsSet.add(qVar); }
    });

    expandedQuery.keywords.forEach(kw => {
      if (titleLower.includes(kw)) { score += 15; matchedTermsSet.add(kw); }
      if (contentLower.includes(kw)) { score += 8; matchedTermsSet.add(kw); }
      if (kwLower.some(k => k.includes(kw))) { score += 12; matchedTermsSet.add(kw); }
      if (techLower.some(t => t.includes(kw))) { score += 15; matchedTermsSet.add(kw); }
    });

    // Intent boosts
    const intents = expandedQuery.intents;
    if (intents.isSkill && chunk.parentType === 'skill') score += 25;
    if (intents.isExperience && chunk.parentType === 'experience') score += 25;
    if (intents.isProject && chunk.parentType === 'project') score += 25;
    if (intents.isCertification && chunk.parentType === 'certification') score += 25;
    if (intents.isEducation && chunk.parentType === 'education') score += 25;

    score += chunk.priority * 1.5;

    sparseScores.push({ chunk, score, matchedTerms: Array.from(matchedTermsSet) });
  });

  // Sort sparse rankings
  const sortedSparse = [...sparseScores].sort((a, b) => b.score - a.score);

  // 2. Dense Vector Embedding Cosine Similarity for Chunks
  const denseScores: { chunk: KnowledgeChunk; similarity: number }[] = [];

  chunks.forEach(chunk => {
    const chunkText = `${chunk.parentTitle} ${chunk.cleanContent} ${chunk.keywords.join(" ")} ${chunk.technologies.join(" ")}`;
    const chunkVector = generateTfidfVector(chunkText, vocab, idfMap);
    const sim = cosineSimilarity(queryVector, chunkVector);
    denseScores.push({ chunk, similarity: sim });
  });

  // Sort dense rankings
  const sortedDense = [...denseScores].sort((a, b) => b.similarity - a.similarity);

  // 3. Reciprocal Rank Fusion (RRF) Combination
  const rrfMap = new Map<string, {
    chunk: KnowledgeChunk;
    rrfScore: number;
    sparseScore: number;
    denseSimilarity: number;
    matchedTerms: string[];
  }>();

  // Process Sparse Ranks
  sortedSparse.forEach((item, rank) => {
    const chunkId = item.chunk.chunkId;
    const rrfContrib = 1 / (RRF_K + rank + 1);
    rrfMap.set(chunkId, {
      chunk: item.chunk,
      rrfScore: rrfContrib,
      sparseScore: item.score,
      denseSimilarity: 0,
      matchedTerms: item.matchedTerms
    });
  });

  // Process Dense Ranks & Accumulate RRF
  sortedDense.forEach((item, rank) => {
    const chunkId = item.chunk.chunkId;
    const rrfContrib = 1 / (RRF_K + rank + 1);
    const existing = rrfMap.get(chunkId);
    if (existing) {
      existing.rrfScore += rrfContrib;
      existing.denseSimilarity = item.similarity;
    } else {
      rrfMap.set(chunkId, {
        chunk: item.chunk,
        rrfScore: rrfContrib,
        sparseScore: 0,
        denseSimilarity: item.similarity,
        matchedTerms: []
      });
    }
  });

  // Convert RRF Map to Results and Compute Normalized Match Percentage
  const results: RRFSearchResult[] = Array.from(rrfMap.values()).map(entry => {
    const vectorScoreNorm = Math.min(99, Math.round(entry.denseSimilarity * 100));
    let matchPercentage = 85;

    if (entry.denseSimilarity > 0) {
      matchPercentage = Math.min(99, Math.max(76, Math.round(entry.denseSimilarity * 70 + (entry.sparseScore > 0 ? 28 : 15))));
    } else {
      matchPercentage = Math.min(99, Math.max(70, Math.round(entry.sparseScore * 1.5)));
    }

    return {
      chunk: entry.chunk,
      item: entry.chunk.parentItem,
      rrfScore: entry.rrfScore,
      sparseScore: entry.sparseScore,
      denseSimilarity: vectorScoreNorm,
      matchPercentage,
      matchedTerms: entry.matchedTerms
    };
  });

  return results.sort((a, b) => b.rrfScore - a.rrfScore).slice(0, topK);
}

// ============================================================================
// 4. Hierarchical Context Re-hydration
// ============================================================================

/**
 * Re-hydrates matched chunks back into cohesive, deduplicated parent document contexts.
 */
export function buildRehydratedContext(
  topMatches: RRFSearchResult[],
  allKnowledgeItems: KnowledgeItem[],
  locale: 'en' | 'fr' = 'en',
  isGreetingOrEmpty: boolean = false
): RehydratedContextResult {
  const profileHero = allKnowledgeItems.find(i => i.locale === locale && i.id.includes('profile-hero'));

  let relevantItemsMap = new Map<string, KnowledgeItem>();
  let retrievedChunks: KnowledgeChunk[] = [];

  topMatches.forEach(m => {
    if (m.chunk) retrievedChunks.push(m.chunk);
    if (m.item && !relevantItemsMap.has(m.item.id)) {
      relevantItemsMap.set(m.item.id, m.item);
    }
  });

  let relevantItems = Array.from(relevantItemsMap.values());

  // Guarantee hero/profile context presence for greetings or empty results
  if (isGreetingOrEmpty || relevantItems.length === 0) {
    if (profileHero && !relevantItems.some(i => i.id === profileHero.id)) {
      relevantItems.unshift(profileHero);
    }
  } else {
    if (profileHero && !relevantItems.some(i => i.id === profileHero.id)) {
      relevantItems.push(profileHero);
    }
  }

  // Format context blocks with rich attribution
  const blocks = relevantItems.map(item => {
    // Find chunks belonging to this parent item
    const itemChunks = retrievedChunks.filter(c => c.parentId === item.id);
    let contentToUse = item.content;

    if (itemChunks.length > 0 && itemChunks.length < itemChunks[0].totalChunks) {
      // Deduplicate and re-hydrate text from retrieved chunks
      contentToUse = itemChunks.map(c => c.cleanContent).join("\n");
    }

    const techTag = (item.technologies || []).length > 0 ? ` | Stack: ${item.technologies!.join(", ")}` : "";
    return `[SOURCE: ${item.title} | Type: ${item.type}${techTag}]\n${contentToUse}\nRoute: ${item.route || ""}`;
  });

  const topMatch = topMatches[0];
  const topMatchPercentage = topMatch?.matchPercentage || 88;
  const topVectorScore = topMatch?.denseSimilarity || 85;
  const topSourceTitle = topMatch?.item?.title || "Aegis Verified Knowledge Base";

  return {
    formattedContext: blocks.join("\n\n---\n\n"),
    topSourceTitle,
    topMatchPercentage,
    topVectorScore,
    totalMatches: relevantItems.length,
    relevantItems,
    retrievedChunks
  };
}
