export interface TelemetryData {
  isSupabaseConnected?: boolean;
  isSupabaseSchemaMissing?: boolean;
  scores: {
    overall: number;
    performance: number;
    reliability: number;
    security: number;
    contact: number;
    engagement: number;
    weekOverWeekDelta: number;
    todayAnomaly: 'nominal' | 'spike' | 'drop';
  };
  trends: {
    daily: Array<{ date: string; visits: number; errors: number; security: number }>;
    historyScores: Array<{ date: string; score: number }>;
  };
  visitors: {
    totalVisits: number;
    uniqueSessions: number;
    returningVisitors: number;
    returnVisits: number;
    avgSessionSec: number;
    pagesPerSession: number;
    entryPage: string;
    exitPage: string;
    returningRatio: number;
    newRatio: number;
    scrollDepths: Array<{ section: string; pct: number }>;
    rankings: Array<{ path: string; qty: number }>;
  };
  engagement: {
    resumeCount: number;
    githubCount: number;
    linkedinCount: number;
    emailCount: number;
    contactBtnClicks: number;
    totalClicks: number;
    conversionRate: number;
    projectClicks: Array<{ id: string; clicks: number }>;
    languageSwitch: Array<{ lang: string; count: number }>;
    themeToggle: Array<{ theme: string; count: number }>;
    accentToggle: Array<{ accent: string; count: number }>;
  };
  contacts: {
    success: number;
    failure: number;
    spam: number;
    turnstileFail: number;
    validationFail: number;
    rateLimited: number;
    conversionRate: number;
    abandonRate: number;
    completionRate: number;
    score: number;
  };
  performance: {
    ttfb: number;
    fcp: number;
    lcp: number;
    cls: number;
    inp: number;
    avgLatency: number;
    totalSlowPages: number;
    totalSlowAssets: number;
    bundleTrends: Array<{ date: string; sizeKb: number }>;
    imageFailures: number;
    fontIssues: number;
  };
  errors: {
    js: number;
    react: number;
    assets: number;
    promises: number;
    api: number;
    total: number;
    impact: number;
    byPage: Array<{ path: string; count: number }>;
    byBrowser: Array<{ browser: string; count: number }>;
    apiFailures: number;
    grouped: Array<{ message: string; count: number }>;
  };
  security: {
    rateLimits: number;
    invalidReqs: number;
    excess404: number;
    turnstile: number;
    csp: number;
    unauthorizedAuth: number;
    overallScore: number;
    warnings: number;
    criticalEvents: number;
    botSpikes: number;
    suspiciousReferrers: Array<{ domain: string; count: number }>;
  };
  deployment: {
    activeVersion: string;
    activeDeployDate: string;
    latencyDeltaPct: number;
    beforeMs: number;
    afterMs: number;
  };
  insights: string[];
  recommendations: string[];
  healthStatus: 'Healthy' | 'Warning' | 'Critical';
  latestSafeEvents: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    tag: 'info' | 'warn' | 'critical';
  }>;
  topVisitorsIntelligence: {
    leaderboard: Array<{
      sessionId: string;
      alias: string;
      country: string;
      totalVisits: number;
      firstVisit: string;
      lastVisit: string;
      avgDurationSec: number;
      totalPagesViewed: number;
      resumeDownloads: number;
      githubClicks: number;
      linkedinClicks: number;
      contactInteractions: number;
      favoriteSection: string;
      favoriteProject: string;
      mostViewedPage: string;
      navigationPath: string[];
      engagementScore: number;
      category: string;
    }>;
    countries: Array<{
      country: string;
      visitorCount: number;
      returnVisitorCount: number;
      avgEngagementScore: number;
      avgSessionDuration: number;
      topInterests: string[];
    }>;
    interests: {
      mostPopularTopics: Array<{ topic: string; score: number }>;
      mostViewedProjects: Array<{ projectId: string; title: string; views: number }>;
      mostViewedSections: Array<{ sectionName: string; views: number }>;
    };
    recruiterJourneys: Array<{
      id: string;
      alias: string;
      country: string;
      path: string[];
      lastActive: string;
      engagementScore: number;
      linkedinClicks: number;
      resumeDownloads: number;
      contacted: boolean;
    }>;
    recruiterJourneysCount: number;
  };
  ai?: AiTelemetryData;
}

export interface AiEventLogItem {
  id?: string;
  session_id?: string;
  message_preview: string;
  response_preview?: string;
  engine: 'gemini' | 'rag';
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_cad: number;
  cost_saved_cad: number;
  cost_usd?: number;
  cost_saved_usd?: number;
  latency_ms: number;
  is_cache_hit: boolean;
  is_semantic_cache_hit?: boolean;
  semantic_similarity?: number;
  security_flag?: 'safe' | 'suspicious' | 'adversarial_probe' | 'injection_attempt';
  threat_category?: string | null;
  threat_score?: number;
  guardrail_triggered?: boolean;
  language: string;
  recruiter_mode: boolean;
  fallback_triggered: boolean;
  created_at: string;
}

export interface TokenBudgetBurndownPoint {
  day: number;
  date: string;
  idealRemaining: number;
  actualRemaining: number;
  actualCostCad: number;
  isProjected?: boolean;
}

export interface TokenBudgetStatus {
  monthlyAllowanceTokens: number;
  monthlyAllowanceCad: number;
  usedTokens: number;
  usedCad: number;
  remainingTokens: number;
  remainingCad: number;
  projectedMonthEndTokens: number;
  projectedMonthEndCad: number;
  dailyBurnRateTokens: number;
  dailyBurnRateCad: number;
  burnStatus: 'nominal' | 'elevated' | 'critical';
  percentUsed: number;
  daysRemainingInCycle: number;
  burndownPoints: TokenBudgetBurndownPoint[];
}

export interface AiTelemetryData {
  overview: {
    totalRequests: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostCad: number;
    totalSavedCad: number;
    totalCostUsd?: number;
    totalSavedUsd?: number;
    avgLatencyMs: number;
    avgTokensPerRequest: number;
    cacheHitRatio: number;
    cacheHits: number;
    cacheMisses: number;
    securityBreakdown: {
      safeCount: number;
      suspiciousCount: number;
      adversarialCount: number;
      injectionCount: number;
      guardrailInterventions: number;
    };
    cacheBreakdown: {
      exactMatches: number;
      semanticMatches: number;
    };
    tokenBudget: TokenBudgetStatus;
    activeModels: string[];
    geminiOnline: boolean;
  };
  modelBreakdown: Array<{
    model: string;
    requests: number;
    tokens: number;
    costCad: number;
    costUsd?: number;
    percentage: number;
  }>;
  engineBreakdown: {
    geminiCount: number;
    ragCount: number;
    cacheHitCount: number;
  };
  languageBreakdown: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  modeBreakdown: {
    recruiterCount: number;
    standardCount: number;
  };
  dailyTrends: Array<{
    date: string;
    requests: number;
    tokens: number;
    costCad: number;
    costUsd?: number;
  }>;
  recentEvents: AiEventLogItem[];
  topTopics: Array<{
    topic: string;
    count: number;
  }>;
}
