import React, { useState } from 'react';
import { 
  UserCheck, Users, Send, MousePointer, Sliders, Compass 
} from 'lucide-react';
import { TelemetryData } from './types';
import { SectionHeader } from './SectionHeader';
import { MetricExplainer } from './MetricExplainer';

interface AudienceTabProps {
  telemetry: TelemetryData;
}

const getCountryLabel = (countryName: string): string => {
  if (!countryName || countryName.toLowerCase().trim() === 'unknown' || countryName.toLowerCase().trim() === 'other') return '🌐 Unknown Region';
  const norm = countryName.toLowerCase().trim();
  if (norm === 'canada') return '🇨🇦 Canada';
  if (norm === 'united states' || norm === 'us' || norm === 'usa') return '🇺🇸 United States';
  if (norm === 'united kingdom' || norm === 'uk' || norm === 'gb') return '🇬🇧 United Kingdom';
  if (norm === 'france') return '🇫🇷 France';
  if (norm === 'ireland') return '🇮🇪 Ireland';
  if (norm === 'india') return '🇮🇳 India';
  if (norm === 'germany') return '🇩🇪 Germany';
  if (norm === 'australia') return '🇦🇺 Australia';
  if (norm === 'japan') return '🇯🇵 Japan';
  if (norm === 'singapore') return '🇸🇬 Singapore';
  if (norm === 'netherlands') return '🇳🇱 Netherlands';
  return `🌐 ${countryName.charAt(0).toUpperCase() + countryName.slice(1)}`;
};

export const AudienceTab: React.FC<AudienceTabProps> = ({ telemetry }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const leaderboardData = telemetry.topVisitorsIntelligence?.leaderboard ?? [];
  const totalPages = Math.ceil(leaderboardData.length / itemsPerPage) || 1;
  const currentData = leaderboardData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-fade-in flex flex-col gap-10">
      
      {/* SECTION 1: Visitor Traffic & Personalization Metrics */}
      <div>
        <SectionHeader 
          id="visitor-analytics"
          title="Visitor Traffic & Identity Personalization" 
          subtitle="Deconstruct deep page interaction matrices, custom accent choices, and dwell times." 
          icon={<UserCheck size={18} />}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Visitor stats cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left relative group">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-[#8B929A] font-semibold uppercase tracking-wider font-mono">Sessions Distinct</p>
                  <MetricExplainer 
                    title="Sessions Distinct"
                    description="Unique browser footprints. Uses GDPR-safe cryptographic salted user-agent hashes to verify unique returning visits."
                    nominalRange="Continuous Vector"
                  />
                </div>
                <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.visitors.uniqueSessions}</div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-[#1F2225]/50">
                  <div>
                    <p className="text-[9px] text-[#8B929A] uppercase tracking-wider">Returning Users</p>
                    <p className="text-sm font-bold text-[#26F0C4]">{telemetry.visitors.returningVisitors}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8B929A] uppercase tracking-wider">Return Visits</p>
                    <p className="text-sm font-bold text-[#E5E7EB]">{telemetry.visitors.returnVisits}</p>
                  </div>
                </div>
                <p className="text-[9px] text-[#8B929A] mt-2 border-t border-[#1F2225]/50 pt-1.5 leading-snug">
                  Calculates cookie-less device fingerprints to monitor discrete visitor engagement safely.
                </p>
              </div>

              <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left relative group">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-[#8B929A] font-semibold uppercase tracking-wider font-mono">Pages Per Session</p>
                  <MetricExplainer 
                    title="Pages Per Session"
                    description="The average count of view routes explored by a single visitor session before closing or navigation away."
                    nominalRange="2.0 - 5.0 nodes"
                  />
                </div>
                <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.visitors.pagesPerSession}</div>
                <span className="text-[10px] text-blue-400 mt-1 block font-mono">Rhythm of interaction</span>
                <p className="text-[9px] text-[#8B929A] mt-2 border-t border-[#1F2225]/50 pt-1.5 leading-snug">
                  Monitors layout exploration density, confirming that portfolio content is discoverable.
                </p>
              </div>

              <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left relative group">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-[#8B929A] font-semibold uppercase tracking-wider font-mono">Average Session Span</p>
                  <MetricExplainer 
                    title="Average Session Span"
                    description="Quantifies overall user dwell-time tracking from initial DOM loads to final beacon exit triggers."
                    nominalRange="45s - 240s"
                  />
                </div>
                <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">
                  {telemetry.visitors.avgSessionSec} <span className="text-xs font-normal font-sans text-[#8B929A]">sec</span>
                </div>
                <span className="text-[10px] text-purple-400 mt-1 block font-mono">Dwell time benchmark</span>
                <p className="text-[9px] text-[#8B929A] mt-2 border-t border-[#1F2225]/50 pt-1.5 leading-snug">
                  Tracks cumulative reading/interaction durations before user leaves connection nodes.
                </p>
              </div>
            </div>

            {/* Path page ranks list */}
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative group">
              <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-[#E5E7EB] flex items-center gap-1">
                  Viewed Node Path Rankings
                  <MetricExplainer 
                    title="Path Rankings"
                    description="Ranks page routes based on raw access hits. Confirms the layout pathways that attract the highest relative frequency."
                    nominalRange="Nominal distributed"
                  />
                </h3>
                <span className="text-[10px] text-[#8B929A] font-mono leading-none">Sorted live</span>
              </div>
              <div className="space-y-3">
                {telemetry.visitors.rankings.map((rank) => {
                  const total = telemetry.visitors.totalVisits || 1;
                  const pct = Math.max(3, Math.round((rank.qty / total) * 100));
                  return (
                    <div key={rank.path}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-[#E5E7EB] font-bold">{rank.path}</span>
                        <span className="text-[#8B929A]">{rank.qty} views ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0C0E] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-[#26F0C4]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#8B929A] mt-3.5 bg-[#0A0C0E]/30 p-2 rounded-xl border border-[#1F2225]/40 font-mono">
                <strong>Analysis:</strong> Compares active page nodes against bounce thresholds to optimize content structure.
              </p>
            </div>

            {/* Entry & Exit Page Diagnostics */}
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left grid grid-cols-1 sm:grid-cols-2 gap-6 relative overflow-visible group">
              <div>
                <h4 className="text-xs font-bold text-blue-400 font-mono uppercase border-b border-[#1F2225]/45 pb-2 mb-3 flex items-center justify-between">
                  <span>Core Entry Page</span>
                  <MetricExplainer 
                    title="Core Entry Node"
                    description="The initial entry point URL path resolved on a user session's first arrival."
                    nominalRange="Usually / home"
                  />
                </h4>
                <span className="text-xs font-extrabold text-[#E5E7EB] font-mono select-all block bg-[#0A0C0E]/40 border border-[#1F2225]/40 py-1.5 px-3 rounded-lg truncate" title={telemetry.visitors.entryPage}>
                  {telemetry.visitors.entryPage}
                </span>
                <span className="text-[10px] text-[#8B929A] mt-1.5 block font-mono">Primary landing gateway.</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-purple-400 font-mono uppercase border-b border-[#1F2225]/45 pb-2 mb-3 flex items-center justify-between">
                  <span>Core Exit Page</span>
                  <MetricExplainer 
                    title="Core Exit Node"
                    description="The final path route recorded before browser tab closure, un-focus triggers, or session expiry is recorded."
                    nominalRange="Usually /contact or /projects"
                  />
                </h4>
                <span className="text-xs font-extrabold text-[#E5E7EB] font-mono select-all block bg-[#0A0C0E]/40 border border-[#1F2225]/40 py-1.5 px-3 rounded-lg truncate" title={telemetry.visitors.exitPage}>
                  {telemetry.visitors.exitPage}
                </span>
                <span className="text-[10px] text-[#8B929A] mt-1.5 block font-mono">Last session view before exit.</span>
              </div>
            </div>

            {/* Section Scroll Depth Retention Indices */}
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative group">
              <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-[#E5E7EB] flex items-center gap-1">
                  Relative Section Scroll Depth Retention
                  <MetricExplainer 
                    title="Scroll Depth Milestones"
                    description="Quantifies how far users scroll down on individual page sections using viewport threshold intersection listeners."
                    nominalRange="40% - 95%"
                  />
                </h3>
                <span className="text-[10px] text-[#8B929A] font-mono">Retention vectors</span>
              </div>
              <div className="space-y-3.5">
                {telemetry.visitors.scrollDepths.map(sc => (
                  <div key={sc.section}>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-[#E5E7EB] font-bold">{sc.section} Section</span>
                      <span className="text-[#26F0C4]">{sc.pct}% depth</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0A0C0E] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#26F0C4] to-emerald-500" style={{ width: `${sc.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#8B929A] mt-4 bg-[#0A0C0E]/30 p-2.5 rounded-xl border border-[#1F2225]/40 leading-normal">
                <strong>Observation:</strong> Evaluates UI visual friction. Drop-offs identify sections needing layout compression or layout refactoring.
              </p>
            </div>
          </div>

          {/* Engagement CTA click list */}
          <div className="lg:col-span-1 space-y-6 text-left">
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 flex flex-col relative group">
              <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-[#E5E7EB] flex items-center gap-2">
                  <MousePointer size={15} />
                  Engagement CTAs Clicks
                  <MetricExplainer 
                    title="External Link CTAs"
                    description="Tracks when users click critical outbound call-to-action triggers like CV PDF, GitHub, LinkedIn, or personal emails."
                    nominalRange="Continuous triggers"
                  />
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#0A0C0E]/50 border border-[#1F2225]/60 rounded-xl relative group">
                  <div>
                    <p className="text-xs font-semibold text-[#8B929A]">Resume Downloads</p>
                    <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{telemetry.engagement.resumeCount}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    {telemetry.engagement.conversionRate}% Conv
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-[#0A0C0E]/40 border border-[#1F2225]/45 rounded-xl relative group">
                    <span className="text-[10px] text-[#8B929A] font-bold block uppercase tracking-wide">GitHub</span>
                    <span className="text-lg font-extrabold text-[#E5E7EB] font-mono block mt-1">{telemetry.engagement.githubCount}</span>
                  </div>
                  <div className="p-3 bg-[#0A0C0E]/40 border border-[#1F2225]/45 rounded-xl relative group">
                    <span className="text-[10px] text-[#8B929A] font-bold block uppercase tracking-wide">LinkedIn</span>
                    <span className="text-lg font-extrabold text-[#E5E7EB] font-mono block mt-1">{telemetry.engagement.linkedinCount}</span>
                  </div>
                  <div className="p-3 bg-[#0A0C0E]/40 border border-[#1F2225]/45 rounded-xl relative group">
                    <span className="text-[10px] text-[#8B929A] font-bold block uppercase tracking-wide">Emails</span>
                    <span className="text-lg font-extrabold text-[#E5E7EB] font-mono block mt-1">{telemetry.engagement.emailCount}</span>
                  </div>
                  <div className="p-3 bg-[#0A0C0E]/40 border border-[#1F2225]/45 rounded-xl relative group">
                    <span className="text-[10px] text-[#8B929A] font-bold block uppercase tracking-wide">Contact</span>
                    <span className="text-lg font-extrabold text-[#E5E7EB] font-mono block mt-1">{telemetry.engagement.contactBtnClicks}</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-[#8B929A] mt-4 border-t border-[#1F2225]/50 pt-3 leading-snug font-mono">
                Determines active intent. Maps which external networks the visitor engages with directly from portfolio grids.
              </p>
            </div>

            {/* Visitor Customization Selections Panel */}
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left space-y-5">
              <h3 className="text-sm font-bold text-[#E5E7EB] border-b border-[#1F2225]/45 pb-3.5 flex items-center gap-2">
                <Sliders size={15} className="text-[#26F0C4]" />
                UI Personalization Metrics
              </h3>

              {/* Theme selections */}
              <div>
                <span className="text-[10px] text-[#8B929A] font-bold uppercase tracking-wider block mb-2 font-mono">Theme Preference Usage</span>
                <div className="space-y-2">
                  {telemetry.engagement.themeToggle.map(t => (
                    <div key={t.theme} className="flex items-center justify-between text-xs">
                      <span className="text-[#8B929A] font-mono">{t.theme}</span>
                      <span className="text-[#E5E7EB] font-bold font-mono">{t.count} cycles</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language switcher usage */}
              <div className="border-t border-[#1F2225]/45 pt-4">
                <span className="text-[10px] text-[#8B929A] font-bold uppercase tracking-wider block mb-2 font-mono">Language Switches</span>
                <div className="space-y-2">
                  {telemetry.engagement.languageSwitch.map(l => (
                    <div key={l.lang} className="flex items-center justify-between text-xs">
                      <span className="text-[#8B929A] font-mono">{l.lang} preference</span>
                      <span className="text-[#E5E7EB] font-bold font-mono">{l.count} times</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accent toggles list */}
              <div className="border-t border-[#1F2225]/45 pt-4">
                <span className="text-[10px] text-[#8B929A] font-bold uppercase tracking-wider block mb-2 font-mono">Accent Selections (Ranked)</span>
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {telemetry.engagement.accentToggle.map(a => (
                    <div key={a.accent} className="flex items-center justify-between text-xs">
                      <span className="text-[#E5E7EB] font-mono">{a.accent}</span>
                      <span className="text-[#8B929A] font-mono font-bold">{a.count} switches</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: AUDIENCE INTELLIGENCE & TOP VISITORS SECTION */}
      <div>
        <SectionHeader 
          id="top-visitors"
          title="Top Visitors Intelligence & Behavioral Audit" 
          subtitle="Durable anonymized audit of visitor paths, automated recruiter sequence mapping, and privacy-safe country distribution metrics." 
          icon={<Users size={18} />}
        />

        {/* OVERVIEW BENCHMARKS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left">
            <span className="text-[10px] font-bold text-[#8B929A] font-mono uppercase tracking-wider block">Recruiter Journeys Detected</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-[#26F0C4] font-mono">{telemetry.topVisitorsIntelligence?.recruiterJourneysCount ?? 0}</span>
              <span className="text-[11px] text-[#8B929A] font-mono">sequences</span>
            </div>
            <div className="mt-3 text-[10px] text-[#8B929A] border-t border-[#1F2225]/50 pt-2 leading-relaxed font-mono">
              Home ➔ Experience ➔ Resume ➔ LinkedIn ➔ Contact sequence matching.
            </div>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left">
            <span className="text-[10px] font-bold text-[#8B929A] font-mono uppercase tracking-wider block">Primary Interest Hub</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-lg font-bold text-blue-400 font-mono truncate max-w-full">
                {telemetry.topVisitorsIntelligence?.interests?.mostViewedSections?.[0]?.sectionName ?? 'Experience'}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-[#8B929A] border-t border-[#1F2225]/50 pt-2 leading-relaxed font-mono">
              Highest aggregated scroll interactions across session footprints.
            </div>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left">
            <span className="text-[10px] font-bold text-[#8B929A] font-mono uppercase tracking-wider block">Top Origin Country</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-sm font-bold text-purple-400 font-mono truncate max-w-full">
                {(() => {
                  const topCountry = [...(telemetry.topVisitorsIntelligence?.countries ?? [])].sort((a,b) => b.visitorCount - a.visitorCount)[0];
                  return topCountry ? getCountryLabel(topCountry.country) : 'Awaiting Data';
                })()}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-[#8B929A] border-t border-[#1F2225]/50 pt-2 leading-relaxed font-mono">
              Origin of maximum high-engagement sessions. Limit country level data.
            </div>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left">
            <span className="text-[10px] font-bold text-[#8B929A] font-mono uppercase tracking-wider block">Audience Health Index</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">Excellent</span>
            </div>
            <div className="mt-3 text-[10px] text-[#8B929A] border-t border-[#1F2225]/50 pt-2 leading-relaxed font-mono">
              Aggregated conversion-to-hire ratio indications.
            </div>
          </div>
        </div>

        {/* TWO COLUMN SUMMARY GRAPH */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 1. TOP COUNTRIES ANALYTICS */}
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left">
            <h3 className="text-sm font-bold text-[#E5E7EB] border-b border-[#1F2225]/45 pb-3.5 mb-4 flex items-center justify-between">
              <span>Geographical Session Dispersion (Country-Level Only)</span>
              <span className="text-[10px] text-[#8B929A] font-mono uppercase tracking-wider bg-[#1C2023] px-2 py-0.5 rounded border border-[#2B3035]/30">Privacy Protected</span>
            </h3>
            <div className="space-y-5">
              {(!telemetry.topVisitorsIntelligence?.countries || telemetry.topVisitorsIntelligence.countries.length === 0) ? (
                 <div className="text-[#8B929A] text-xs font-mono py-12 text-center bg-[#0A0C0E]/50 border border-[#1F2225] rounded-xl flex flex-col items-center justify-center gap-2">
                   <div className="text-[#4E555C] text-lg">🌍</div>
                   <span>AWAITING GEOGRAPHICAL TELEMETRY</span>
                 </div>
              ) : (
                (telemetry.topVisitorsIntelligence?.countries ?? []).map((c) => {
                  const maxVisitors = Math.max(...(telemetry.topVisitorsIntelligence?.countries ?? []).map(co => co.visitorCount)) || 1;
                  const widthPct = Math.max(5, Math.min(100, (c.visitorCount / maxVisitors) * 100));
                  return (
                    <div key={c.country} className="group">
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#E5E7EB]">
                            {getCountryLabel(c.country)}
                          </span>
                          <span className="text-[10px] text-[#8B929A]">({c.returnVisitorCount} returning)</span>
                        </div>
                        <span className="text-[#8B929A] font-bold">{c.visitorCount} sessions • {Math.round(c.avgSessionDuration)}s avg</span>
                      </div>
                      
                      <div className="w-full h-2 bg-[#0A0C0E] rounded-full overflow-hidden mb-1.5">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-[#26F0C4] rounded-full transition-all duration-300 scale-x-100 origin-left"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
  
                      <div className="flex flex-wrap gap-1.5 items-center mt-1">
                        <span className="text-[9px] text-[#8B929A] font-mono mr-1">Top Interests:</span>
                        {c.topInterests.map((interest) => (
                          <span key={interest} className="text-[9px] font-mono bg-[#1E2225] border border-[#2B3035] text-[#26F0C4] px-1.5 py-0.5 rounded">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. VISITOR INTERESTS ANALYTICS */}
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#E5E7EB] border-b border-[#1F2225]/45 pb-3.5 mb-4">
                Visitor Interest Density Index
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Popular Topics Heat */}
                <div>
                  <span className="text-[10px] text-[#8B929A] font-bold uppercase tracking-wider block mb-2.5 font-mono">Popular Topics Score</span>
                  <div className="space-y-2">
                    {(telemetry.topVisitorsIntelligence?.interests?.mostPopularTopics ?? []).slice(0, 4).map((t) => (
                      <div key={t.topic} className="bg-[#0A0C0E] border border-[#1F2225]/50 rounded-lg p-2 font-mono">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#E5E7EB] truncate max-w-[110px]" title={t.topic}>{t.topic}</span>
                          <span className="text-[#26F0C4] font-bold">{t.score}</span>
                        </div>
                        <div className="w-full h-1 bg-[#1F2225] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, t.score)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects Viewed */}
                <div>
                  <span className="text-[10px] text-[#8B929A] font-bold uppercase tracking-wider block mb-2.5 font-mono">Top Projects Analyzed</span>
                  <div className="space-y-1.5">
                    {(telemetry.topVisitorsIntelligence?.interests?.mostViewedProjects ?? []).slice(0, 4).map((proj) => (
                      <div key={proj.projectId} className="flex items-center justify-between text-[11px] font-mono bg-[#0A0C0E]/50 border border-[#1F2225]/30 p-2 rounded-lg">
                        <span className="text-[#8B929A] truncate max-w-[100px] font-semibold" title={proj.title}>{proj.title}</span>
                        <span className="text-[#E5E7EB] bg-[#141719] border border-[#1F2225] px-1.5 py-0.5 rounded font-bold text-[10px]">
                          {proj.views} views
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1F2225]/40 pt-4 mt-4">
              <span className="text-[10px] text-[#8B929A] font-bold uppercase tracking-wider block mb-2.5 font-mono">Scroll-Focus Section Heat Rating</span>
              <div className="grid grid-cols-3 gap-2">
                {(telemetry.topVisitorsIntelligence?.interests?.mostViewedSections ?? []).map(s => (
                  <div key={s.sectionName} className="bg-[#0A0C0E] border border-[#1F2225]/40 p-2 rounded-xl text-center font-mono">
                    <p className="text-[9px] text-[#8B929A] uppercase truncate">{s.sectionName}</p>
                    <p className="text-xs font-bold text-[#26F0C4] mt-0.5">{s.views} triggers</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RECRUITER JOURNEYS LISTING */}
        <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left mb-6">
          <h3 className="text-sm font-bold text-[#E5E7EB] border-b border-[#1F2225]/45 pb-3.5 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Compass size={14} className="text-[#26F0C4]" />
              Potential Recruiter Journeys & Sequences
            </span>
            <span className="text-[10px] text-blue-400 font-mono font-bold uppercase">Journeys Matched</span>
          </h3>

          <div className="space-y-4">
            {(!telemetry.topVisitorsIntelligence?.recruiterJourneys || telemetry.topVisitorsIntelligence.recruiterJourneys.length === 0) ? (
              <div className="text-center py-6 text-xs text-[#8B929A] font-mono bg-[#0A0C0E] rounded-2xl border border-[#1F2225]/50">
                No matching recruiter sequences logged in the current filter period.
              </div>
            ) : (
              telemetry.topVisitorsIntelligence.recruiterJourneys.map((j) => (
                <div key={j.id} className="bg-[#0A0C0E] border border-[#1F2225]/60 hover:border-blue-500/20 rounded-2xl p-4 transition-all group relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm font-black text-[#E5E7EB]">{j.alias}</span>
                        <span className="text-[10px] font-mono bg-[#1C2023] border border-[#2B3035]/60 text-blue-400 px-2 py-0.5 rounded">
                          {getCountryLabel(j.country)}
                        </span>
                        <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                          Recruiter Pattern Matched
                        </span>
                      </div>
                      <div className="flex items-center gap-3.5 mt-2 flex-wrap">
                        <span className="text-[11px] text-[#8B929A] font-mono">LinkedIn Clicks: <span className="text-[#E5E7EB] font-bold">{j.linkedinClicks}</span></span>
                        <span className="text-[11px] text-[#8B929A] font-mono">Resume DLs: <span className="text-[#E5E7EB] font-bold">{j.resumeDownloads}</span></span>
                        <span className="text-[11px] text-[#8B929A] font-mono">Contact Form Sent: <span className={j.contacted ? "text-emerald-400 font-bold" : "text-[#8B929A] font-bold"}>{j.contacted ? "Yes ✅" : "No ❌"}</span></span>
                        <span className="text-[10px] text-[#8B929A] font-mono italic">Seen: {new Date(j.lastActive).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-mono text-[#8B929A] tracking-wider font-semibold">Engagement Score</p>
                        <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{j.engagementScore}<span className="text-[10px] font-normal text-[#8B929A]">/100</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1F2225]/45 flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="text-[10px] text-[#8B929A] uppercase tracking-wider font-bold">Heuristic Navigation Sequence:</span>
                    {j.path.map((node: string, idx: number) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-[#8B929A]/50">➔</span>}
                        <span className="bg-[#141719] border border-[#2B3035]/50 px-2 py-0.5 rounded text-[#E5E7EB] text-[10px]">
                          {node}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AUDIENCE LEADERBOARD CARDS LIST */}
        <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2225]/45 pb-3.5 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#E5E7EB]">Anonymized Visitor Profiles Leaderboard</h3>
              <p className="text-[11px] text-[#8B929A] mt-0.5 leading-normal">Deterministically hashed static profiles derived from secure cryptographic session IDs.</p>
            </div>
            <span className="text-[10px] text-[#8B929A] font-mono uppercase bg-[#1C2023] px-2 py-0.5 rounded border border-[#2B3035]/30 self-start sm:self-center">Sorted by engagement</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentData.map((v) => (
              <div key={v.sessionId} className="bg-[#0A0C0E] border border-[#1C2023] hover:border-[#26F0C4]/35 p-5 rounded-2xl transition-all relative flex flex-col justify-between gap-4 group">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#1F2225]/45 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#E5E7EB] tracking-tight">{v.alias}</span>
                      <span className="text-[9px] font-mono bg-[#141719] border border-[#2B3035]/60 text-[#26F0C4] px-2 py-0.5 rounded">
                        {getCountryLabel(v.country)}
                      </span>
                    </div>
                    
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      v.category === 'Recruiter Journey' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      v.category === 'Technical Explorer' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' :
                      v.category === 'Career Researcher' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                      v.category === 'Resume Focused Visitor' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      'bg-purple-500/10 border-purple-500/20 text-purple-400'
                    }`}>
                      {v.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono mb-3 bg-[#141719]/55 border border-[#1F2225]/40 p-2 rounded-xl">
                    <div>
                      <p className="text-[#8B929A] uppercase tracking-wider text-[8px]">Total Visits</p>
                      <p className="text-[#E5E7EB] font-bold mt-0.5">{v.totalVisits} times</p>
                    </div>
                    <div>
                      <p className="text-[#8B929A] uppercase tracking-wider text-[8px]">Page Views</p>
                      <p className="text-[#E5E7EB] font-bold mt-0.5">{v.totalPagesViewed} nodes</p>
                    </div>
                    <div>
                      <p className="text-[#8B929A] uppercase tracking-wider text-[8px]">Avg Session</p>
                      <p className="text-[#E5E7EB] font-bold mt-0.5">{v.avgDurationSec}s</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono mb-3">
                    <div className="bg-[#141719] border border-[#1F2225]/30 p-1.5 rounded-lg">
                      <span className="block text-[#8B929A] text-[8px] uppercase font-bold">📄 Resume</span>
                      <span className="text-[#E5E7EB] font-bold text-xs">{v.resumeDownloads}</span>
                    </div>
                    <div className="bg-[#141719] border border-[#1F2225]/30 p-1.5 rounded-lg">
                      <span className="block text-[#8B929A] text-[8px] uppercase font-bold">🐙 GitHub</span>
                      <span className="text-[#E5E7EB] font-bold text-xs">{v.githubClicks}</span>
                    </div>
                    <div className="bg-[#141719] border border-[#1F2225]/30 p-1.5 rounded-lg">
                      <span className="block text-[#8B929A] text-[8px] uppercase font-bold">🛡️ LinkedIn</span>
                      <span className="text-[#E5E7EB] font-bold text-xs">{v.linkedinClicks}</span>
                    </div>
                    <div className="bg-[#141719] border border-[#1F2225]/30 p-1.5 rounded-lg">
                      <span className="block text-[#8B929A] text-[8px] uppercase font-bold">✉️ Contact</span>
                      <span className="text-[#E5E7EB] font-bold text-xs">{v.contactInteractions}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[10.5px] font-mono border-t border-[#1F2225]/35 pt-3 mt-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#8B929A]">Primary Focus Section:</span>
                      <span className="text-[#E5E7EB] font-bold">{v.favoriteSection}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B929A]">Primary Interest Project:</span>
                      <span className="text-[#E5E7EB] font-bold truncate max-w-[150px]" title={v.favoriteProject}>
                        {v.favoriteProject === 'None' ? 'None' : v.favoriteProject.replace('project-', '')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B929A]">Most Visited Route:</span>
                      <span className="text-[#E5E7EB] font-bold truncate max-w-[150px]">{v.mostViewedPage}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-[#8B929A]">Engagement Meter:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#141719] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400" style={{ width: `${v.engagementScore}%` }} />
                        </div>
                        <span className="text-[#E5E7EB] font-black">{v.engagementScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1F2225]/35 pt-3 mt-1 text-[10px] font-mono leading-none flex flex-wrap items-center gap-1">
                  <span className="text-[#8B929A] uppercase tracking-wider font-bold mr-1 block sm:inline">User Sequence:</span>
                  {v.navigationPath.map((pathName, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="text-[#8B929A]/40">&gt;</span>}
                      <span className="text-[#E5E7EB] font-semibold bg-[#141719] px-1.5 py-0.5 rounded border border-[#1F2225]/45 text-[9px]">
                        {pathName}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {leaderboardData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 bg-[#0A0C0E]/50 rounded-xl border border-[#1F2225]/45">
              <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <span className="text-[11px] text-[#8B929A] font-mono">Show:</span>
                <select 
                  className="bg-[#141719] border border-[#2B3035] text-[#E5E7EB] text-xs font-mono rounded px-2 py-1 outline-none focus:border-[#26F0C4]/50"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-[11px] text-[#8B929A] font-mono">per page</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="text-xs font-mono px-3 py-1.5 rounded bg-[#141719] border border-[#2B3035] text-[#8B929A] hover:text-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs font-mono text-[#E5E7EB]">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="text-xs font-mono px-3 py-1.5 rounded bg-[#141719] border border-[#2B3035] text-[#8B929A] hover:text-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Contact & Conversion Pipeline */}
      <div>
        <SectionHeader 
          id="conversion-pipelines"
          title="Contact Conversibility & verification Pipeline" 
          subtitle="Verification analytics, honeypots triggers history, and security puzzle failures tracker." 
          icon={<Send size={18} />}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left col-span-1 relative group">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#8B929A] font-semibold uppercase font-mono">Form Deliveries</p>
              <MetricExplainer 
                title="Form Deliveries"
                description="Successfully validated message dispatches routed and saved to Supabase portfolio databases."
                nominalRange="Continuous submissions"
              />
            </div>
            <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.contacts.success}</div>
            <span className="text-[10px] text-[#26F0C4] mt-1 block font-semibold">Successfully relayed</span>
            <p className="text-[9px] text-[#8B929A] mt-2.5 border-t border-[#1F2225]/50 pt-1.5 font-mono leading-tight">
              Valid entries dispatched to database.
            </p>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left col-span-1 relative group">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#8B929A] font-semibold uppercase font-mono">Conversion Rate</p>
              <MetricExplainer 
                title="Conversion Ratio"
                description="Percentage of overall discrete unique users who successfully dispatched an email form inquiry."
                formula="Rate = (Form Deliveries / Unique Sessions) * 100"
                nominalRange="1.0% - 5.0%"
              />
            </div>
            <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.contacts.conversionRate}%</div>
            <span className="text-[10px] text-blue-400 mt-1 block">Traffic-submission ratios</span>
            <p className="text-[9px] text-[#8B929A] mt-2.5 border-t border-[#1F2225]/50 pt-1.5 font-mono leading-tight">
              Form submissions per unique viewer.
            </p>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left col-span-1 relative group">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#8B929A] font-semibold uppercase font-mono">Completion Rate</p>
              <MetricExplainer 
                title="Completion Rate"
                description="Calculates the ratio of successfully completed contact form entries against overall clicks initiated on Contact buttons."
                formula="Completion = (Deliveries / Contact Clicks) * 100"
                nominalRange="50% - 85%"
              />
            </div>
            <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.contacts.completionRate}%</div>
            <span className="text-[10px] text-purple-400 mt-1 block font-semibold">Total clicks converted</span>
            <p className="text-[9px] text-[#8B929A] mt-2.5 border-t border-[#1F2225]/50 pt-1.5 font-mono leading-tight">
              Finished forms vs initial clicks.
            </p>
          </div>

          <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left col-span-1 relative group">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#8B929A] font-semibold uppercase font-mono">Reliability Rating</p>
              <MetricExplainer 
                title="Form Verification Integrity"
                description="Determines system integrity based on low Cloudflare Turnstile puzzle errors and zero validation bypass attempts."
                nominalRange="95% - 100% Secure"
              />
            </div>
            <div className="text-3xl font-black text-[#E5E7EB] mt-1.5 font-mono">{telemetry.contacts.score}%</div>
            <span className="text-[10px] text-yellow-400 mt-1 block font-semibold">Turnstile security nominal</span>
            <p className="text-[9px] text-[#8B929A] mt-2.5 border-t border-[#1F2225]/50 pt-1.5 font-mono leading-tight">
              Overall safe traffic verification.
            </p>
          </div>

          {/* Breakdown sub blocks */}
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl relative group">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[#8B929A] block font-mono">Bot Honeypot/Spam Blocks</span>
                <MetricExplainer 
                  title="Spam Blocks"
                  description="Form submissions immediately filtered out due to hidden honeypot fields filled by headless automated scripts."
                  nominalRange="0 instances"
                />
              </div>
              <span className="text-2xl font-black text-[#E5E7EB] mt-1.5 font-mono block">{telemetry.contacts.spam}</span>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">Tricked bot submit-engine alerts.</p>
            </div>
            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl relative group">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[#8B929A] block font-mono">Clashes on Captcha</span>
                <MetricExplainer 
                  title="Captcha Clashes"
                  description="Submissions where Cloudflare Turnstile tokens either failed to authenticate, or were outright missing."
                  nominalRange="0 failures"
                />
              </div>
              <span className="text-2xl font-black text-[#E5E7EB] mt-1.5 font-mono block">{telemetry.contacts.turnstileFail}</span>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">Failed Turnstile integrity tokens.</p>
            </div>
            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl relative group">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[#8B929A] block font-mono">Validation Failures</span>
                <MetricExplainer 
                  title="Validation Failures"
                  description="Forms submitted containing broken formats or missing required fields like sender email or message text."
                  nominalRange="0 failures"
                />
              </div>
              <span className="text-2xl font-black text-[#E5E7EB] mt-1.5 font-mono block">{telemetry.contacts.validationFail}</span>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">Format validator checks rejected.</p>
            </div>
            <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl relative group">
              <div className="flex justify-between items-start">
                <span className="text-xs text-[#8B929A] block font-mono">Rate Limited Attempts</span>
                <MetricExplainer 
                  title="Form Rate Limiter"
                  description="Attempts immediately rate-limited by IP firewall to halt flood attacks on contact modules."
                  nominalRange="0 throttle actions"
                />
              </div>
              <span className="text-2xl font-black text-[#E5E7EB] mt-1.5 font-mono block">{telemetry.contacts.rateLimited}</span>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">SRE protective flood throttling.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
export default AudienceTab;
