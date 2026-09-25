import React from 'react';
import { 
  Activity, LayoutGrid, CheckCircle, AlertTriangle, TrendingUp, Sparkles, Settings, Shield
} from 'lucide-react';
import { TelemetryData } from './types';
import { SectionHeader } from './SectionHeader';
import { MetricExplainer } from './MetricExplainer';

interface OverviewTabProps {
  telemetry: TelemetryData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ telemetry }) => {
  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Overview & Health Header */}
      <SectionHeader 
        id="executive-summary"
        title="Weighted Executive Analysis & Health Graph" 
        subtitle="Overall system state health computations, daily metrics progressions, and automated heuristics." 
        icon={<LayoutGrid size={18} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BENTO BLOCK A: RADIAL OVERALL HEALTH AND SCORE METERS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative overflow-visible flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#1F2225]/45 pb-4 mb-5">
              <div>
                <h3 className="text-sm md:text-md font-bold text-[#E5E7EB] flex items-center gap-1">
                  Weighted Health Score Overview
                  <MetricExplainer 
                    title="Weighted Health Score"
                    description="Comprehensive operational assessment score mapped weightedly across server health monitors, load speeds, intrusion defensive shields, and user interactive pathways."
                    formula="Overall = (Performance * 0.35) + (Reliability * 0.25) + (SecOps * 0.20) + (Engagement * 0.10) + (Enquiry * 0.10)"
                    nominalRange="90 - 100%"
                  />
                </h3>
                <p className="text-[11px] text-[#8B929A] mt-0.5">SRE mathematical evaluation: Perf 35%, Rel 25%, Sec 20%, Eng 10%, Form 10%</p>
              </div>
              <span className="p-2 bg-blue-600/10 rounded-xl text-blue-400">
                <Activity size={16} />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              {/* Radial Main Gauge */}
              <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-[#0A0C0E]/55 border border-[#1F2225]/40 rounded-2xl relative group">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#1F2225" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="#26F0C4" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * telemetry.scores.overall) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-3xl font-black text-[#E5E7EB] font-mono">{telemetry.scores.overall}</span>
                    <p className="text-[9px] font-semibold text-[#8B929A] uppercase tracking-wider">Score</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 mt-3 font-mono">
                  {telemetry.healthStatus}
                </span>
                
                <p className="text-[10px] text-[#8B929A] text-center mt-3 leading-tight opacity-75 group-hover:opacity-100 transition-opacity">
                  Average of all operational indices calculated in real-time.
                </p>
              </div>

              {/* Individual Components bars */}
              <div className="md:col-span-3 space-y-3.5">
                <div className="bg-[#0A0C0E]/30 p-2 border border-[#1F2225]/35 rounded-xl">
                  <div className="flex justify-between text-xs mb-1 font-mono items-center">
                    <span className="text-[#8B929A] flex items-center gap-1 select-none font-bold">
                      Performance Index
                      <MetricExplainer 
                        title="Performance Index"
                        description="Average responsive index calculated of Largest Contentful Paint, Time To First Byte, and First Contentful Paint metrics across user devices."
                        nominalRange="85 - 100"
                      />
                    </span>
                    <span className="text-blue-400 font-bold">{telemetry.scores.performance}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0A0C0E] rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-blue-400 transition-all duration-1000" style={{ width: `${telemetry.scores.performance}%` }} />
                  </div>
                  <span className="text-[9px] text-[#8B929A] font-mono leading-none block">Weighted latency, asset optimization, and CDN routing rating.</span>
                </div>

                <div className="bg-[#0A0C0E]/30 p-2 border border-[#1F2225]/35 rounded-xl">
                  <div className="flex justify-between text-xs mb-1 font-mono items-center">
                    <span className="text-[#8B929A] flex items-center gap-1 select-none font-bold">
                      Reliability Index (Static Integrity)
                      <MetricExplainer 
                        title="Reliability Index"
                        description="Evaluates overall system availability, static layout offset values, and low API errors connection thresholds."
                        nominalRange="95 - 100"
                      />
                    </span>
                    <span className="text-[#26F0C4] font-bold">{telemetry.scores.reliability}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0A0C0E] rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-[#26F0C4] transition-all duration-1000" style={{ width: `${telemetry.scores.reliability}%` }} />
                  </div>
                  <span className="text-[9px] text-[#8B929A] font-mono leading-none block">Availability rating of static resources, hosting nodes, and layout shifts.</span>
                </div>

                <div className="bg-[#0A0C0E]/30 p-2 border border-[#1F2225]/35 rounded-xl">
                  <div className="flex justify-between text-xs mb-1 font-mono items-center">
                    <span className="text-[#8B929A] flex items-center gap-1 select-none font-bold">
                      SecOps Security Score
                      <MetricExplainer 
                        title="SecOps Security Score"
                        description="Security operational compliance score based on blocking bad referrers, filtering injection/header crawlers, and mitigating credential failures."
                        nominalRange="90 - 100"
                      />
                    </span>
                    <span className="text-yellow-400 font-bold">{telemetry.scores.security}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0A0C0E] rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${telemetry.scores.security}%` }} />
                  </div>
                  <span className="text-[9px] text-[#8B929A] font-mono leading-none block">Measures firewall integrity, login defenses, and Redis rate limiters.</span>
                </div>

                <div className="bg-[#0A0C0E]/30 p-2 border border-[#1F2225]/35 rounded-xl">
                  <div className="flex justify-between text-xs mb-1 font-mono items-center">
                    <span className="text-[#8B929A] flex items-center gap-1 select-none font-bold">
                      Engagement Intensity Index
                      <MetricExplainer 
                        title="Engagement Index"
                        description="Quantifies how deeply visitors interact with the portfolio (such as project views, language switching, theme preferences, and link clicks)."
                        nominalRange="70 - 100"
                      />
                    </span>
                    <span className="text-purple-400 font-bold">{telemetry.scores.engagement}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0A0C0E] rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-purple-400 transition-all duration-1000" style={{ width: `${telemetry.scores.engagement}%` }} />
                  </div>
                  <span className="text-[9px] text-[#8B929A] font-mono leading-none block">Measures interaction frequencies, personalization actions, and clicks.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic SRE Diagnostics & Smart Alerts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-5 text-left relative group">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#8B929A] font-mono block uppercase">Week-over-Week Traffic Delta</span>
                <MetricExplainer 
                  title="Traffic Progression" 
                  description="The percentage difference of traffic recorded this week versus the previous week, indicating site growth."
                  nominalRange="-10% to +100%"
                />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-2xl font-black font-mono ${telemetry.scores.weekOverWeekDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {telemetry.scores.weekOverWeekDelta >= 0 ? '+' : ''}{telemetry.scores.weekOverWeekDelta}%
                </span>
                <span className="text-[10px] font-mono text-[#8B929A]">vs previous 14 days</span>
              </div>
              <p className="text-[10px] text-[#E5E7EB]/70 border-t border-[#1F2225] pt-2 mt-2.5 leading-normal">
                <strong>Insight:</strong> Sourced through unique daily daily connection signatures to monitor continuous user acquisition vectors.
              </p>
            </div>

            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-5 text-left relative group">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#8B929A] font-mono block uppercase">Real-Time Traffic Anomaly Index</span>
                <MetricExplainer 
                  title="Traffic Anomaly Index" 
                  description="Unlocks statistical deviations in visitor frequency, highlighting potential bot spikes, traffic drop-offs, or server performance anomalies."
                  nominalRange="Nominal (0 - 30% Delta)"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  telemetry.scores.todayAnomaly === 'spike' ? 'bg-amber-400 animate-pulse' :
                  telemetry.scores.todayAnomaly === 'drop' ? 'bg-red-500 animate-pulse' :
                  'bg-emerald-400 animate-pulse'
                }`} />
                <span className="text-xl font-black font-mono text-[#E5E7EB] capitalize">
                  {telemetry.scores.todayAnomaly} pattern
                </span>
              </div>
              <p className="text-[10px] text-[#E5E7EB]/70 border-t border-[#1F2225] pt-2 mt-2.5 leading-normal">
                <strong>Diagnostics:</strong> Flags sudden 50%+ departures from standard rolling 30-day traffic baselines.
              </p>
            </div>

            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-5 text-left relative overflow-visible group">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#8B929A] font-mono block uppercase">Needs SRE Attention</span>
                <MetricExplainer 
                  title="SRE Heuristics Watchdog" 
                  description="Automated watchdog which validates real-time system performance counters and filters errors or attack warnings."
                  nominalRange="Secure Operating State Nominal"
                />
              </div>
              <div className="mt-2.5 space-y-1.5 min-h-[36px]">
                {telemetry.errors.total > 5 ? (
                  <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-mono">
                    <AlertTriangle size={11} /> High Exception frequency
                  </div>
                ) : null}
                {telemetry.security.botSpikes > 0 ? (
                  <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] font-mono">
                    <Shield size={11} /> Active Crawler patterns
                  </div>
                ) : null}
                {telemetry.contacts.abandonRate > 35 ? (
                  <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-mono">
                    <Activity size={11} /> Form dynamic abandonment
                  </div>
                ) : null}
                {telemetry.errors.total <= 5 && telemetry.security.botSpikes === 0 && telemetry.contacts.abandonRate <= 35 ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono">
                    <CheckCircle size={11} /> Secure operations nominal
                  </div>
                ) : null}
              </div>
              <p className="text-[10px] text-[#E5E7EB]/70 border-t border-[#1F2225] pt-2 mt-2 leading-normal flex-grow">
                <strong>Status:</strong> Immediate issues prioritized using real-world heuristic models.
              </p>
            </div>
          </div>

          {/* Daily Traffic Progression Line Graph */}
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1F2225]/45 pb-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-[#E5E7EB]">Daily Traffic Trend Vector</h3>
                <p className="text-xs text-[#8B929A]">Visits and security interceptions logged</p>
              </div>
              <span className="p-2 bg-[#26F0C4]/10 rounded-xl text-[#26F0C4]">
                <TrendingUp size={16} />
              </span>
            </div>

            <div className="h-44 w-full relative pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 35" preserveAspectRatio="none">
                <line x1="0" y1="9" x2="100" y2="9" stroke="#1F2225" strokeWidth="0.15" strokeDasharray="1" />
                <line x1="0" y1="18" x2="100" y2="18" stroke="#1F2225" strokeWidth="0.15" strokeDasharray="1" />
                <line x1="0" y1="27" x2="100" y2="27" stroke="#1F2225" strokeWidth="0.15" strokeDasharray="1" />

                {(() => {
                  const list = telemetry.trends.daily;
                  if (!list || list.length === 0) return null;
                  const maxVal = Math.max(...list.map(t => t.visits), 10);
                  
                  const visitsPoints = list.map((v, i) => {
                    const x = (i / Math.max(1, list.length - 1)) * 100;
                    const y = 30 - (v.visits / maxVal) * 25;
                    return `${x},${y}`;
                  }).join(' ');

                  const securityPoints = list.map((v, i) => {
                    const x = (i / Math.max(1, list.length - 1)) * 100;
                    const y = 30 - ((v.security * 8) / maxVal) * 25;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline points={visitsPoints} fill="none" stroke="#26F0C4" strokeWidth="1.5" strokeLinecap="round" />
                      <polyline points={securityPoints} fill="none" stroke="#E11D48" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1" />
                      
                      {list.map((v, i) => {
                        const x = (i / Math.max(1, list.length - 1)) * 100;
                        const y = 30 - (v.visits / maxVal) * 25;
                        return <circle key={i} cx={x} cy={y} r="1" fill="#26F0C4" />;
                      })}
                    </>
                  );
                })()}
              </svg>

              <div className="flex justify-between border-t border-[#1F2225] pt-2 text-[9px] font-mono text-[#8B929A] px-1">
                {telemetry.trends.daily.map((t, idx) => {
                  const isMobileSpaced = idx === 0 || 
                    idx === Math.floor(telemetry.trends.daily.length / 3) || 
                    idx === Math.floor(2 * telemetry.trends.daily.length / 3) || 
                    idx === telemetry.trends.daily.length - 1;
                  return (
                    <span 
                      key={idx} 
                      className={isMobileSpaced ? 'block' : 'hidden sm:block'}
                    >
                      {t.date.split('-').slice(1).join('/')}
                    </span>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-1 text-[9px] font-mono text-[#8B929A] justify-center select-none">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[#26F0C4]" /> Visits</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[#E11D48] bg-opacity-80" /> Interceptions</span>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO BLOCK B: HEURISTIC INSIGHTS AND RECS */}
        <div className="lg:col-span-1 flex flex-col gap-6 text-left">
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#1F2225]/45">
                <Sparkles className="text-[#26F0C4]" size={16} />
                <h3 className="text-sm font-bold text-[#E5E7EB]">Command Heuristic Insights</h3>
              </div>
              
              <div className="space-y-4">
                {telemetry.insights.map((ins, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-[#E5E7EB] leading-relaxed">{ins}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1F2225]/45">
              <h4 className="text-xs font-bold text-yellow-400 mb-3 flex items-center gap-1.5">
                <Settings size={13} />
                Actionable Recommendations
              </h4>
              <div className="space-y-3">
                {telemetry.recommendations.map((rec, i) => (
                  <div key={i} className="p-2.5 bg-[#0A0C0E]/50 border border-yellow-500/10 rounded-xl text-[11px] text-[#8B929A] leading-relaxed">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default OverviewTab;
