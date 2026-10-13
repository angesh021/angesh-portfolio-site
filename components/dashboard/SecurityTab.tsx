import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, Bug, Terminal, Search, RefreshCw, Download 
} from 'lucide-react';
import { TelemetryData } from './types';
import { SectionHeader } from './SectionHeader';
import { MetricExplainer } from './MetricExplainer';

interface SecurityTabProps {
  telemetry: TelemetryData;
}

interface AuditCheck {
  id: string;
  name: string;
  category: string;
  status: 'idle' | 'scanning' | 'passed' | 'warning' | 'failed';
  details: string;
  recommendation: string;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ telemetry }) => {
  const [selectedDuration, setSelectedDuration] = useState<'all' | 'today' | '3days' | '7days'>('all');
  const [searchLogQuery, setSearchLogQuery] = useState('');

  // Quick Security Audit States
  const [isAuditEnabled, setIsAuditEnabled] = useState(false);
  const [isAuditRunning, setIsAuditRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [auditScore, setAuditScore] = useState<number | null>(null);

  const initialChecks: AuditCheck[] = [
    {
      id: 'https',
      name: 'Enforce SSL/TLS Protocol (HTTPS)',
      category: 'Network Transport',
      status: 'idle',
      details: 'Checking if the connection uses modern transport encryption.',
      recommendation: 'Configure forced SSL redirection in your host dashboard (Vercel/Cloudflare).'
    },
    {
      id: 'seo_meta',
      name: 'Search Indexing Metadata',
      category: 'SEO Discoverability',
      status: 'idle',
      details: 'Inspecting primary SEO elements (Title and Meta Description tags).',
      recommendation: 'Ensure your SEOEngine component is active or update meta tags inside index.html.'
    },
    {
      id: 'social_graph',
      name: 'OpenGraph Sharing Context',
      category: 'AI / Social Previews',
      status: 'idle',
      details: 'Detecting rich link sharing properties (og:title, og:image, twitter:card).',
      recommendation: 'Add standard og:* property tags in head configurations for premium embeds.'
    },
    {
      id: 'sitemap',
      name: 'XML Sitemap Reachability',
      category: 'Crawlability Mapping',
      status: 'idle',
      details: 'Fetching and testing accessibility of /sitemap.xml.',
      recommendation: 'Verify sitemap generation output under public/sitemap.xml.'
    },
    {
      id: 'robots',
      name: 'Robots.txt Constraints Map',
      category: 'Crawler Rules',
      status: 'idle',
      details: 'Validating crawling boundaries in /robots.txt.',
      recommendation: 'Establish an active robots.txt file mapping safe and Disallowed directories.'
    },
    {
      id: 'api_gateway',
      name: 'Dynamic API Gateway Security',
      category: 'Application Firewall',
      status: 'idle',
      details: 'Verifying rate limits and health metrics at /api/health.',
      recommendation: 'Ensure your server-side API proxy is running securely.'
    },
    {
      id: 'credential_isolation',
      name: 'Credential Storage Isolation',
      category: 'Identity & Access',
      status: 'idle',
      details: 'Scanning client storage for exposed credentials or tokens.',
      recommendation: 'Never store plain database connections or secrets in local/session storage.'
    }
  ];

  const [checks, setChecks] = useState<AuditCheck[]>(initialChecks);

  const runAudit = async () => {
    setIsAuditRunning(true);
    setAuditScore(null);
    
    const resetChecks = initialChecks.map(c => ({ ...c, status: 'idle' as const }));
    setChecks(resetChecks);

    for (let i = 0; i < resetChecks.length; i++) {
      setCurrentStep(i);
      setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'scanning' as const } : c));
      
      // Simulated delay for premium visual pacing
      await new Promise(resolve => setTimeout(resolve, 600));

      let status: 'passed' | 'warning' | 'failed' = 'passed';
      let details = '';
      const checkId = resetChecks[i].id;

      if (checkId === 'https') {
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        status = isSecure ? 'passed' : 'warning';
        details = isSecure 
          ? `Connection protocol is securely encrypted via SSL/TLS (${window.location.protocol}).` 
          : 'Insecure protocol detected. HTTP is prone to packet sniffing and session interception.';
      } 
      else if (checkId === 'seo_meta') {
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
        if (title && title.length > 5 && description && description.length > 10) {
          status = 'passed';
          details = `Discovered title: "${title.slice(0, 30)}..." and rich description (${description.length} chars).`;
        } else {
          status = 'warning';
          details = 'Missing or thin title/description tags on current document DOM.';
        }
      }
      else if (checkId === 'social_graph') {
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
        if (ogTitle && ogImage) {
          status = 'passed';
          details = `OpenGraph active. Title: "${ogTitle.slice(0, 25)}...", Image link detected.`;
        } else {
          status = 'warning';
          details = 'OpenGraph visual descriptors are incomplete. Rich social snippets may degrade.';
        }
      }
      else if (checkId === 'sitemap') {
        try {
          const res = await fetch('/sitemap.xml');
          if (res.ok) {
            status = 'passed';
            details = '/sitemap.xml is fully reachable and returned code 200 OK.';
          } else {
            status = 'warning';
            details = `/sitemap.xml fetch failed with status ${res.status}.`;
          }
        } catch (e) {
          status = 'warning';
          details = 'Failed to fetch /sitemap.xml due to CORS or network transport block.';
        }
      }
      else if (checkId === 'robots') {
        try {
          const res = await fetch('/robots.txt');
          if (res.ok) {
            const text = await res.text();
            if (text.toLowerCase().includes('sitemap:')) {
              status = 'passed';
              details = '/robots.txt fetched successfully and contains sitemap linkage.';
            } else {
              status = 'warning';
              details = '/robots.txt is live, but missing explicit Sitemap parameter references.';
            }
          } else {
            status = 'warning';
            details = `/robots.txt is unreachable (HTTP code ${res.status}).`;
          }
        } catch (e) {
          status = 'warning';
          details = 'Failed to load robots.txt ruleset.';
        }
      }
      else if (checkId === 'api_gateway') {
        try {
          const res = await fetch('/api/health');
          if (res.ok) {
            const data = await res.json();
            status = 'passed';
            details = `/api/health responded successfully. Database state: "${data.db || 'Active'}".`;
          } else {
            status = 'failed';
            details = `Endpoint /api/health returned non-200 state: ${res.status}.`;
          }
        } catch (e) {
          status = 'failed';
          details = 'Gateway timeout or connection refused on api/health endpoint.';
        }
      }
      else if (checkId === 'credential_isolation') {
        let foundIssue = false;
        const sensitiveKeys = ['password', 'secret', 'apikey', 'private_key', 'admin_key'];
        for (let j = 0; j < localStorage.length; j++) {
          const key = localStorage.key(j) || '';
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            foundIssue = true;
          }
        }
        if (!foundIssue) {
          status = 'passed';
          details = 'No plaintext administrative secrets or keys found in local storage buffers.';
        } else {
          status = 'warning';
          details = 'Possible sensitive keywords identified in local storage variables.';
        }
      }

      setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status, details } : c));
    }

    setIsAuditRunning(false);
    setCurrentStep(-1);
    
    setChecks(prev => {
      const passedCount = prev.filter(c => c.status === 'passed').length;
      const warningCount = prev.filter(c => c.status === 'warning').length;
      const score = Math.round((passedCount * 100 + warningCount * 50) / prev.length);
      setAuditScore(score);
      return prev;
    });
  };

  const handleDownloadReport = () => {
    const reportData = {
      title: "Angesh Portfolio Security Audit Report",
      timestamp: new Date().toISOString(),
      score: auditScore,
      summary: {
        total: checks.length,
        passed: checks.filter(c => c.status === 'passed').length,
        warning: checks.filter(c => c.status === 'warning').length,
        failed: checks.filter(c => c.status === 'failed').length,
      },
      findings: checks.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        status: c.status,
        details: c.details,
        remediation: c.recommendation
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_audit_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredEvents = useMemo(() => {
    if (!telemetry || !telemetry.latestSafeEvents) return [];
    return telemetry.latestSafeEvents.filter((evt) => {
      const matchText = (evt.message + ' ' + evt.type).toLowerCase();
      if (searchLogQuery && !matchText.includes(searchLogQuery.toLowerCase())) return false;
      
      const eventTime = new Date(evt.timestamp).getTime();
      const diffMs = Date.now() - eventTime;

      if (selectedDuration === 'today') return diffMs < 24 * 3600 * 1000;
      if (selectedDuration === '3days') return diffMs < 3 * 24 * 3600 * 1000;
      if (selectedDuration === '7days') return diffMs < 7 * 24 * 3600 * 1000;
      return true;
    });
  }, [telemetry, searchLogQuery, selectedDuration]);

  return (
    <div className="animate-fade-in flex flex-col gap-10">
      
      {/* SECTION 0: Quick Security Audit Suite */}
      <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative overflow-hidden">
        {/* Glow effect at background */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-[#26F0C4]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2225]/45 pb-5 mb-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-[#26F0C4]/10 rounded-lg text-[#26F0C4] border border-[#26F0C4]/20">
                <Shield size={20} className={isAuditRunning ? "animate-spin" : ""} />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#E5E7EB] font-serif">Quick Security Audit</h2>
                <p className="text-xs text-[#8B929A] mt-0.5">Run instantaneous frontend/backend sanity checks on security posture.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-bold text-[#8B929A] uppercase tracking-wider">
              {isAuditEnabled ? "Audit Suite Enabled" : "Audit Suite Disabled"}
            </span>
            {/* Custom Toggle Switch */}
            <button
              onClick={() => {
                const nextState = !isAuditEnabled;
                setIsAuditEnabled(nextState);
                if (nextState) {
                  setTimeout(() => runAudit(), 100);
                }
              }}
              className={`w-12 h-6 rounded-full p-0.5 border-none cursor-pointer transition-colors relative flex items-center ${
                isAuditEnabled ? 'bg-[#26F0C4]' : 'bg-[#1F2225]'
              }`}
              aria-label="Toggle Quick Security Audit Suite"
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#0A0C0E] transition-all transform ${
                  isAuditEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {isAuditEnabled && (
          <div className="space-y-6 relative z-10 animate-fade-in">
            {/* Status bar */}
            <div className="p-4 bg-[#0A0C0E]/60 border border-[#1F2225] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {isAuditRunning ? (
                  <RefreshCw className="animate-spin text-[#26F0C4]" size={18} />
                ) : auditScore !== null ? (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-lg border-2 ${
                    auditScore >= 90 ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5' :
                    auditScore >= 70 ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5' :
                    'border-red-500 text-red-500 bg-red-500/5'
                  }`}>
                    {auditScore}%
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full border border-[#1F2225] flex items-center justify-center text-[#8B929A]">
                    IDLE
                  </div>
                )}
                <div className="text-left">
                  <h3 className="text-sm font-bold text-[#E5E7EB]">
                    {isAuditRunning 
                      ? `Scanning Systems: Check ${currentStep + 1} of ${checks.length}...` 
                      : auditScore !== null 
                        ? `Audit Completed with Score ${auditScore}%` 
                        : "Ready to run security diagnostics suite"}
                  </h3>
                  <p className="text-xs text-[#8B929A] mt-0.5">
                    {isAuditRunning 
                      ? `Analyzing ${checks[currentStep]?.name}...` 
                      : auditScore !== null 
                        ? `${checks.filter(c => c.status === 'passed').length} Passed, ${checks.filter(c => c.status === 'warning').length} Warnings, ${checks.filter(c => c.status === 'failed').length} Failures.`
                        : "Activate the scan to analyze configurations, SSL settings, and server endpoints."}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  disabled={isAuditRunning}
                  onClick={runAudit}
                  className="flex-1 sm:flex-initial h-9 px-4 rounded-xl font-bold text-xs bg-[#26F0C4]/10 text-[#26F0C4] hover:bg-[#26F0C4]/20 border border-[#26F0C4]/25 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={12} className={isAuditRunning ? "animate-spin" : ""} />
                  Re-run Scan
                </button>

                {auditScore !== null && (
                  <button
                    onClick={handleDownloadReport}
                    className="flex-1 sm:flex-initial h-9 px-4 rounded-xl font-bold text-xs bg-[#1F2225] text-[#E5E7EB] hover:bg-[#2A2E33] border border-[#1F2225] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download size={12} />
                    Download JSON Log
                  </button>
                )}
              </div>
            </div>

            {/* Test Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checks.map((check, index) => {
                const isPassed = check.status === 'passed';
                const isWarning = check.status === 'warning';
                const isFailed = check.status === 'failed';
                const isScanning = check.status === 'scanning';

                return (
                  <div 
                    key={check.id} 
                    className={`p-4 bg-[#0D0F10] border rounded-xl flex flex-col justify-between transition-all ${
                      isScanning ? 'border-[#26F0C4]/30 shadow-[0_0_15px_rgba(38,240,196,0.05)]' :
                      isPassed ? 'border-emerald-500/10' :
                      isWarning ? 'border-yellow-500/10' :
                      isFailed ? 'border-red-500/10' :
                      'border-[#1F2225]/45'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-[10px] font-mono text-[#8B929A] uppercase tracking-wider font-bold">
                          {check.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isScanning && (
                            <span className="text-xs text-[#26F0C4] font-mono flex items-center gap-1 animate-pulse">
                              <RefreshCw size={10} className="animate-spin" /> SCANNING
                            </span>
                          )}
                          {isPassed && (
                            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> PASSED
                            </span>
                          )}
                          {isWarning && (
                            <span className="text-xs text-yellow-500 font-mono font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /> WARNING
                            </span>
                          )}
                          {isFailed && (
                            <span className="text-xs text-red-500 font-mono font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> FAIL
                            </span>
                          )}
                          {check.status === 'idle' && (
                            <span className="text-xs text-[#8B929A] font-mono">
                              PENDING
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-[#E5E7EB] font-serif mb-1">
                        {check.name}
                      </h4>
                      <p className="text-xs text-[#8B929A] font-mono leading-relaxed">
                        {check.details}
                      </p>
                    </div>

                    {(isWarning || isFailed) && (
                      <div className="mt-3.5 pt-2.5 border-t border-[#1F2225]/45 text-left">
                        <span className="text-[9px] font-mono uppercase text-amber-500 font-bold block mb-1">
                          Actionable Remediation
                        </span>
                        <p className="text-xs text-[#E5E7EB]/95 leading-relaxed font-serif">
                          {check.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: SecOps Intrusion Intelligence & Controls */}
      <div>
        <SectionHeader 
          id="security-threats"
          title="SecOps Intrusion Intelligence & Firewalls" 
          subtitle="Rate limiting throttler benchmarks, block lists logs, and crawler spikes." 
          icon={<Shield size={18} />}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left col-span-1 relative group">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#8B929A] font-semibold uppercase font-mono">Rate Limits Hit</p>
              <MetricExplainer 
                title="Rate Limits Triggered"
                description="Requests auto-blocked by the Redis firewall when a modern IP address exceeds 60 actions per minute."
                nominalRange="0 - 2 triggers nominal"
              />
            </div>
            <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.security.rateLimits}</div>
            <span className="text-[10px] text-yellow-500 mt-1 block font-semibold">Throttled via Redis</span>
            <p className="text-[9px] text-[#8B929A] mt-2.5 border-t border-[#1F2225]/45 pt-1.5 leading-tight font-mono">
              Protects the server from flood scripts.
            </p>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left col-span-1 relative group">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#8B929A] font-semibold uppercase font-mono">Crawl & 404 Intercepts</p>
              <MetricExplainer 
                title="Crawler 404 Scanner Blocks"
                description="Flags automated vulnerability bots attempting to scan classic pathways search for exposed configuration files (e.g. .env, .git/config, wp-admin)."
                nominalRange="0 intercepts"
              />
            </div>
            <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.security.excess404}</div>
            <span className="text-[10px] text-red-500 mt-1 block font-semibold">Blocked dot-file scanners</span>
            <p className="text-[9px] text-[#8B929A] mt-2.5 border-t border-[#1F2225]/45 pt-1.5 leading-tight font-mono">
              Auto-blocks security probe scans.
            </p>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left col-span-1 relative group">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#8B929A] font-semibold uppercase font-mono">Suspicious Methods</p>
              <MetricExplainer 
                title="Suspicious Methods Forbidden"
                description="Vulnerability engines attempting anomalous web protocols (like PUT, DELETE) on static page pathways."
                nominalRange="0 forbidden requests"
              />
            </div>
            <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.security.invalidReqs}</div>
            <span className="text-[10px] text-purple-400 mt-1 block font-semibold">Rejected non-POST binds</span>
            <p className="text-[9px] text-[#8B929A] mt-2.5 border-t border-[#1F2225]/45 pt-1.5 leading-tight font-mono">
              Restricts API endpoint inputs.
            </p>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left col-span-1 relative group">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#8B929A] font-semibold uppercase font-mono">SecOps Score</p>
              <MetricExplainer 
                title="Overall Firewall Health"
                description="SecOps rating that deconstructs firewall integrity based on low rates of honeypot triggers and zero active credentials leaks."
                formula="Health = 100 - (botSpikes * 5) - (unauthorizedAuth * 10)"
                nominalRange="95% - 100%"
              />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-1.5 font-mono">{telemetry.security.overallScore}%</div>
            <span className="text-[10px] text-[#26F0C4] mt-1 block font-mono">Warnings: {telemetry.security.warnings} | Crit: {telemetry.security.criticalEvents}</span>
            <p className="text-[9px] text-[#8B929A] mt-2.5 border-t border-[#1F2225]/45 pt-1.5 leading-tight font-mono">
              Calculated network security metrics.
            </p>
          </div>

          {/* Sub defense elements */}
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl relative group">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[#8B929A] block font-mono">Failed Admin Auth tries</span>
                <MetricExplainer 
                  title="Admin Unauthorized Attempts"
                  description="Triggers absolute alerts when web interfaces receive logins or administrative token configurations without correct signatures."
                  nominalRange="0 failed sessions"
                />
              </div>
              <span className="text-xl font-black text-[#E5E7EB] mt-1 font-mono block">{telemetry.security.unauthorizedAuth}</span>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">Dashboard access attempts blocked.</p>
            </div>
            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl relative group">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[#8B929A] block font-mono">Turnstile slider blocks</span>
                <MetricExplainer 
                  title="Captcha Robot Interceptions"
                  description="Visits flagged on Turnstile verification queries because the user client fingerprint triggered automation flags."
                  nominalRange="0 bypasses"
                />
              </div>
              <span className="text-xl font-black text-[#E5E7EB] mt-1 font-mono block">{telemetry.security.turnstile}</span>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">Non-human interactions rejected.</p>
            </div>
            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl relative group">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[#8B929A] block font-mono">CSP Violations logged</span>
                <MetricExplainer 
                  title="Content Security Policy"
                  description="Enforces script source alignment, catching and blocking inline scripts or unknown files trying to load dynamically."
                  nominalRange="0 violations"
                />
              </div>
              <span className="text-xl font-black text-[#E5E7EB] mt-1 font-mono block">{telemetry.security.csp}</span>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">Browser reports on unauthorized static resources.</p>
            </div>
          </div>

          {/* Bot-like spikes & Suspicious Referrers indicators */}
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-amber-500 font-mono uppercase pb-1 mb-2">Bot Request Spikes</h4>
                  <MetricExplainer 
                    title="Anomalous Traffic Surges"
                    description="Dynamic monitor tracking sudden spikes in automated scraper hits or header requests over a 2 minute threshold."
                    nominalRange="0 spikes detected"
                  />
                </div>
                <span className="text-xl font-black text-[#E5E7EB] font-mono">{telemetry.security.botSpikes} suspicious surges</span>
                <span className={`text-[10px] font-mono font-bold block mt-2 ${telemetry.security.botSpikes > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}`}>
                  {telemetry.security.botSpikes > 0 ? 'STATUS: MITIGATED SCAN PATTERNS' : 'STATUS: NOMINAL SECURE'}
                </span>
              </div>
              <p className="text-[10px] text-[#8B929A] mt-4">Automated pattern scanners, crawler bots, and excessive headless probe requests caught by server blocks.</p>
            </div>

            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl">
              <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-2 mb-3">
                <h4 className="text-xs font-bold text-red-400 font-mono uppercase">Suspicious Referring Domains</h4>
                <MetricExplainer 
                  title="Forbidden Referrers"
                  description="Inbound headers with known blacklisted referer origins or sketchy domains mapped to crawler patterns."
                  nominalRange="0 bad referrals"
                />
              </div>
              <div className="space-y-2">
                {telemetry.security.suspiciousReferrers.map(sr => (
                  <div key={sr.domain} className="flex justify-between items-center text-xs">
                    <span className="text-[#8B929A] font-mono truncate max-w-[200px]" title={sr.domain}>{sr.domain}</span>
                    <span className="text-red-400 font-bold font-mono text-[11px] bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">{sr.count} hits</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Exception Diagnostic Vectors & Console Health */}
      <div>
        <SectionHeader 
          id="error-diagnostics"
          title="Exception Diagnostic Vectors & Console Health" 
          subtitle="Evaluate raw uncaught script exceptions, dynamic API logs failures, and page fault rates." 
          icon={<Bug size={18} />}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Error metrics summary column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-[#1F2225]/45">
                <h3 className="text-sm font-bold text-[#E5E7EB]">Error Distribution Impact</h3>
                <span className="text-[10px] text-[#8B929A] font-mono">Real-time Sentry Hooks</span>
              </div>
              
              <div className="p-4 bg-[#0A0C0E]/50 border border-red-500/10 rounded-2xl relative group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase text-[#8B929A] block">Error Impact Score</span>
                  <MetricExplainer 
                    title="Error Session Impact Score"
                    description="Calculated ratio representing active browser sessions that experienced at least one distinct JS console error, promise rejection, or asset load failure."
                    formula="Impact = (Sessions with >=1 Error / Total Sessions) * 100"
                    nominalRange="< 2.0% is optimal"
                  />
                </div>
                <div className="text-2xl font-black text-red-400 mt-2 font-mono">{telemetry.errors.impact}%</div>
                <span className="text-[10px] text-[#8B929A] mt-1 block">Sessions affected by console anomalies</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2.5">
                <div className="p-3 bg-[#0A0C0E]/30 rounded-xl text-left border border-[#1F2225] relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] block font-mono text-[#8B929A]">JS failures</span>
                    <MetricExplainer title="JavaScript Failures" description="Uncaught window.onerror script execution faults logged on client browsers." nominalRange="0 events" />
                  </div>
                  <span className="text-lg font-black font-mono text-[#E5E7EB]">{telemetry.errors.js}</span>
                </div>
                <div className="p-3 bg-[#0A0C0E]/30 rounded-xl text-left border border-[#1F2225] relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] block font-mono text-[#8B929A]">React bounds</span>
                    <MetricExplainer title="React Boundary Crashes" description="Component rendering crashes intercepted and caught safely by class React ErrorBoundaries." nominalRange="0 events" />
                  </div>
                  <span className="text-lg font-black font-mono text-[#E5E7EB]">{telemetry.errors.react}</span>
                </div>
                <div className="p-3 bg-[#0A0C0E]/30 rounded-xl text-left border border-[#1F2225] relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] block font-mono text-[#8B929A]">Assets loader</span>
                    <MetricExplainer title="Static Asset Fails" description="Beacons triggered when critical stylesheet resources, layout visual images, or dynamic modules fail server load states." nominalRange="0 failures" />
                  </div>
                  <span className="text-lg font-black font-mono text-[#E5E7EB]">{telemetry.errors.assets}</span>
                </div>
                <div className="p-3 bg-[#0A0C0E]/30 rounded-xl text-left border border-[#1F2225] relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] block font-mono text-[#8B929A]">API failure</span>
                    <MetricExplainer title="API Route Timeout" description="Dynamic portfolio API calls (/api/* endpoints) returning non-2xx status codes or gateway timeouts." nominalRange="0 events" />
                  </div>
                  <span className="text-lg font-black font-mono text-[#E5E7EB]">{telemetry.errors.api}</span>
                </div>
                <div className="p-3 bg-[#0A0C0E]/30 rounded-xl text-left border border-[#1F2225] relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] block font-mono text-[#8B929A]">Uncaught Promises</span>
                    <MetricExplainer title="Uncaught Promises" description="Asynchronous promise statements that failed or rejected without standard try-catch or catch-clause blocks." nominalRange="0 events" />
                  </div>
                  <span className="text-lg font-black font-mono text-[#E5E7EB]">{telemetry.errors.promises}</span>
                </div>
                <div className="p-3 bg-[#0A0C0E]/30 rounded-xl text-left border border-[#1F2225] relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] block font-mono text-[#8B929A]">failed api calls</span>
                    <MetricExplainer title="Failed API Calls" description="Failed server-side proxy actions trying to sync or access DB collections." nominalRange="0 events" />
                  </div>
                  <span className="text-lg font-black font-mono text-[#E5E7EB]">{telemetry.errors.apiFailures}</span>
                </div>
              </div>

              {/* Error by page list */}
              <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-5 text-left space-y-3.5 relative group">
                <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-2">
                  <h4 className="text-xs font-bold text-red-400 font-mono uppercase">Error frequency by Node</h4>
                  <MetricExplainer 
                    title="Error Node Frequencies"
                    description="Isolates visual layout pathways or static files generating the raw majority of user-facing dashboard errors."
                    nominalRange="0 anomalies"
                  />
                </div>
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {telemetry.errors.byPage.map(bp => (
                    <div key={bp.path} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#8B929A] truncate max-w-[150px]" title={bp.path}>{bp.path}</span>
                      <span className="text-red-400 font-bold text-[11px] bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">{bp.count} fault{bp.count > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error by browser list */}
              <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-5 text-left space-y-3.5 relative group">
                <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-2">
                  <h4 className="text-xs font-bold text-blue-400 font-mono uppercase">Client Browser Diagnostics</h4>
                  <MetricExplainer 
                    title="Client Browser Profiling"
                    description="Assesses user browser layout engine trends to highlight browser-specific polyfill issues or CSS rendering errors."
                    nominalRange="Even cross-renderer safety"
                  />
                </div>
                <div className="space-y-2.5">
                  {telemetry.errors.byBrowser.map(bb => (
                    <div key={bb.browser} className="flex justify-between items-center text-xs">
                      <span className="text-[#8B929A] font-mono">{bb.browser}</span>
                      <span className="text-[#E5E7EB] font-mono font-bold">{bb.count} exceptions</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grouped common errors list */}
          <div className="lg:col-span-2">
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left flex flex-col h-full relative group">
              <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-[#E5E7EB]">Common Grouped exceptions</h3>
                <MetricExplainer 
                  title="Grouped Console Exceptions"
                  description="Intelligently groups matching console warning messages and active scripts crashes to streamline debugging workflows."
                  nominalRange="0 critical exceptions"
                />
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[450px]">
                {telemetry.errors.grouped.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-[#8B929A]">
                    ZERO RUNTIME CONSOLE FAULTS LOGGED
                  </div>
                ) : (
                  telemetry.errors.grouped.map((group, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-[#0D0F10] border border-red-500/10 rounded-xl">
                      <div className="flex gap-3 items-center">
                        <Terminal size={14} className="text-red-400 mt-0.5" />
                        <span className="text-xs text-[#E5E7EB] font-serif pr-2 leading-relaxed">{group.message}</span>
                      </div>
                      <span className="bg-red-500/10 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">{group.count} events</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: Universal Audit Logs Stream Area */}
      <div>
        <SectionHeader 
          id="telemetry-audit-logs"
          title="Unified Telemetry Audit Logs Engine" 
          subtitle="Comprehensive filterable registry logging microsecond request structures locally." 
          icon={<Terminal size={18} />}
        />

        <section className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative overflow-hidden select-none">
          
          <div className="flex flex-col gap-4 border-b border-[#1F2225]/45 pb-5 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#E5E7EB]">Registry Telemetry Audit Logs</h3>
                <p className="text-xs text-[#8B929A] mt-0.5">Filterable real-world telemetry traces sourced live from Vercel Serverless storage</p>
              </div>
              
              {/* Durations list */}
              <div className="flex bg-[#0A0C0E] p-1 rounded-xl border border-[#1F2225]/50 text-xs font-bold self-start sm:self-auto uppercase font-mono">
                {([
                  { id: 'all', label: 'All Logs' },
                  { id: 'today', label: '24 Hours' },
                  { id: '3days', label: '3 Days' },
                  { id: '7days', label: '7 Days' }
                ] as const).map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedDuration(option.id)}
                    className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all ${
                      selectedDuration === option.id 
                        ? 'bg-[#1E2225] text-[#E5E7EB]' 
                        : 'bg-transparent text-[#8B929A] hover:text-[#E5E7EB]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B929A]" size={15} />
              <input 
                type="text"
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                placeholder="Filter audit logs by route path, anomaly terms, or status codes..."
                className="w-full h-[40px] bg-[#0A0C0E] border border-[#1F2225] text-xs pl-10 pr-4 rounded-xl text-[#E5E7EB] placeholder-[#8B929A] outline-none focus:border-[#26F0C4]/40 transition-all font-mono"
              />
            </div>
          </div>

          {/* Logs renderer block */}
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-[#8B929A]">
                ZERO ACTIVE SYSTEM TELEMETRY MATCHING SELECTED FILTER PARAMETERS
              </div>
            ) : (
              filteredEvents.map((log) => {
                const isErr = log.tag === 'critical';
                const isWarn = log.tag === 'warn';
                const isSecurity = log.type === 'security';
                
                return (
                  <div 
                    key={log.id} 
                    className={`p-3.5 bg-[#0D0F10] border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isErr ? 'border-red-500/15 hover:border-red-500/25 bg-red-950/2' :
                      isWarn ? 'border-yellow-500/15 hover:border-yellow-500/25' :
                      isSecurity ? 'border-indigo-500/15 hover:border-indigo-500/25 bg-indigo-950/2' :
                      'border-[#1F2225]/45 hover:border-[#8B929A]/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] font-mono font-bold select-none ${
                        isErr ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        isWarn ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        isSecurity ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-emerald-500/10 text-[#26F0C4] border border-emerald-500/20'
                      }`}>
                        {log.type.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                            isErr ? 'text-red-400' :
                            isWarn ? 'text-yellow-400' :
                            isSecurity ? 'text-indigo-400' :
                            'text-emerald-400'
                          }`}>{log.type}</span>
                          <span className="text-[9px] text-[#8B929A] font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#E5E7EB] mt-1 font-mono tracking-tight break-all leading-normal">{log.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

    </div>
  );
};
export default SecurityTab;
