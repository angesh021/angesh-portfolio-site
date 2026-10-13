import React from 'react';
import { 
  Zap, Image, FileCode 
} from 'lucide-react';
import { TelemetryData } from './types';
import { SectionHeader } from './SectionHeader';
import { MetricExplainer } from './MetricExplainer';

interface PerformanceTabProps {
  telemetry: TelemetryData;
}

const getLCPRatingStr = (lcp: number) => {
  if (lcp <= 2500) return { label: 'Good (Nominal)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (lcp <= 4000) return { label: 'Needs Optimization', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
  return { label: 'Poor', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
};

const getCLSRatingStr = (cls: number) => {
  if (cls <= 0.1) return { label: 'Good', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (cls <= 0.25) return { label: 'Needs Optimization', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
  return { label: 'Poor', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
};

const getINPRatingStr = (inp: number) => {
  if (inp <= 200) return { label: 'Good (Nominal)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (inp <= 500) return { label: 'Needs Optimization', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
  return { label: 'Poor', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
};

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ telemetry }) => {
  return (
    <div className="animate-fade-in flex flex-col gap-8">
      
      <SectionHeader 
        id="performance-audits"
        title="Performance Core Web Vitals & Audits" 
        subtitle="High fidelity rendering intervals, Vercel edge latency metrics, and static asset sizing reports." 
        icon={<Zap size={18} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Vitals breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative group">
            <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-3.5 mb-4">
              <h3 className="text-sm font-bold text-[#E5E7EB] flex items-center gap-1.5">
                Core Web Vitals Indicators
                <MetricExplainer 
                  title="Core Web Vitals (Google)"
                  description="Google standard metrics that measure core user experience points such as page load speed, layout stability, and click responsiveness."
                  nominalRange="Excellent thresholds shown"
                />
              </h3>
              <span className="text-[10px] text-[#26F0C4] font-mono">Chrome UX Report aligned</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/40 rounded-2xl relative group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase text-[#8B929A] block">LCP (Largest Paint)</span>
                  <MetricExplainer 
                    title="Largest Contentful Paint"
                    description="Measures when the largest visible text block or image element is drawn on the viewport."
                    nominalRange="< 2.5s is optimal"
                  />
                </div>
                <div className="text-2xl font-black text-[#E5E7EB] mt-2 font-mono">{telemetry.performance.lcp} <span className="text-xs font-normal text-[#8B929A]">ms</span></div>
                <span className={`text-[9px] font-mono font-bold border px-1.5 py-0.5 rounded block mt-3 text-center ${getLCPRatingStr(telemetry.performance.lcp).color}`}>
                  {getLCPRatingStr(telemetry.performance.lcp).label}
                </span>
                <p className="text-[9px] text-[#8B929A] mt-2 leading-tight">Measures perceived rendering speed of major screen modules.</p>
              </div>

              <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/40 rounded-2xl relative group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase text-[#8B929A] block">CLS (Layout Shift)</span>
                  <MetricExplainer 
                    title="Cumulative Layout Shift"
                    description="Evaluates cumulative scores of unexpected visual layout shifts of elements during rendering."
                    nominalRange="< 0.1 is optimal"
                  />
                </div>
                <div className="text-2xl font-black text-[#E5E7EB] mt-2 font-mono">{telemetry.performance.cls}</div>
                <span className={`text-[9px] font-mono font-bold border px-1.5 py-0.5 rounded block mt-3 text-center ${getCLSRatingStr(telemetry.performance.cls).color}`}>
                  {getCLSRatingStr(telemetry.performance.cls).label}
                </span>
                <p className="text-[9px] text-[#8B929A] mt-2 leading-tight">Measures layout elements sliding during download stages.</p>
              </div>

              <div className="p-4 bg-[#0A0C0E]/50 border border-[#1F2225]/40 rounded-2xl relative group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase text-[#8B929A] block">INP (Interaction Next)</span>
                  <MetricExplainer 
                    title="Interaction to Next Paint"
                    description="Calculates site latency response for user touch, click, or key actions done in the running viewport."
                    nominalRange="< 200ms is optimal"
                  />
                </div>
                <div className="text-2xl font-black text-[#E5E7EB] mt-2 font-mono">{telemetry.performance.inp} <span className="text-xs font-normal text-[#8B929A]">ms</span></div>
                <span className={`text-[9px] font-mono font-bold border px-1.5 py-0.5 rounded block mt-3 text-center ${getINPRatingStr(telemetry.performance.inp).color}`}>
                  {getINPRatingStr(telemetry.performance.inp).label}
                </span>
                <p className="text-[9px] text-[#8B929A] mt-2 leading-tight">Replaces FID. Tracks raw responsive lag of action click handlers.</p>
              </div>
            </div>

            {/* Secondary latency and degradation audit telemetry */}
            <div className="mt-5 pt-5 border-t border-[#1F2225]/40 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="relative group">
                <span className="text-[10px] font-mono uppercase text-[#8B929A] flex items-center justify-between">
                  <span>Mean Operational Latency</span>
                  <MetricExplainer 
                    title="Mean Operational Latency"
                    description="Average roundtrip latency calculated for browser-to-server endpoints (including edge server nodes)."
                    nominalRange="< 150 ms ideal"
                  />
                </span>
                <div className="text-xl font-black text-[#E5E7EB] mt-1 font-mono">{telemetry.performance.avgLatency} <span className="text-xs font-normal text-[#8B929A]">ms</span></div>
                <p className="text-[9px] text-[#8B929A] mt-1">Average static/dynamic response time roundtrip</p>
              </div>
              <div className="relative group">
                <span className="text-[10px] font-mono uppercase text-[#8B929A] flex items-center justify-between">
                  <span>Degraded Section Loads</span>
                  <MetricExplainer 
                    title="Degraded Page Loads"
                    description="Triggered when full section component mount structures exceed the 3.0-second edge threshold."
                    nominalRange="0 instances"
                  />
                </span>
                <div className="text-xl font-black text-rose-500 mt-1 font-mono">{telemetry.performance.totalSlowPages} <span className="text-xs font-normal text-[#8B929A]">events</span></div>
                <p className="text-[9px] text-[#8B929A] mt-1">Navigation exceeding the 3s nominal limit</p>
              </div>
              <div className="relative group">
                <span className="text-[10px] font-mono uppercase text-[#8B929A] flex items-center justify-between">
                  <span>Sluggish Asset Triggers</span>
                  <MetricExplainer 
                    title="Sluggish Asset Triggers"
                    description="Flags static images, icons, script modules, or stylesheets that take more than 1.5 seconds to hydrate dynamically."
                    nominalRange="< 3 occurrences"
                  />
                </span>
                <div className="text-xl font-black text-amber-500 mt-1 font-mono">{telemetry.performance.totalSlowAssets} <span className="text-xs font-normal text-[#8B929A]">triggers</span></div>
                <p className="text-[9px] text-[#8B929A] mt-1">Media and scripts loading slower than 1.5s</p>
              </div>
            </div>
          </div>

          {/* TTFB vs FCP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left relative group">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-[#8B929A] uppercase flex items-center gap-1">
                  Time To First Byte
                  <MetricExplainer 
                    title="Time to First Byte"
                    description="Tracks time elapsed between client request initiates and server side first-byte socket deliverables received on browser threads."
                    nominalRange="50ms - 250ms limit"
                  />
                </span>
                <span className="text-xs font-bold text-[#E5E7EB] font-mono">{telemetry.performance.ttfb} ms</span>
              </div>
              <div className="w-full h-1 bg-[#0A0C0E] rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, (telemetry.performance.ttfb / 100) * 100)}%` }} />
              </div>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">Measures responsive speed of hosting networks and Edge TLS connections.</p>
            </div>

            <div className="bg-[#141719] border border-[#1F2225] rounded-2xl p-5 text-left relative group">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-[#8B929A] uppercase flex items-center gap-1">
                  First Contentful Paint
                  <MetricExplainer 
                    title="First Contentful Paint"
                    description="The duration taken to render the first interactive element or DOM section (such as menu vectors, loader symbols, or header text)."
                    nominalRange="100ms - 1000ms limit"
                  />
                </span>
                <span className="text-xs font-bold text-[#E5E7EB] font-mono">{telemetry.performance.fcp} ms</span>
              </div>
              <div className="w-full h-1 bg-[#0A0C0E] rounded-full overflow-hidden">
                <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, (telemetry.performance.fcp / 200) * 100)}%` }} />
              </div>
              <p className="text-[9px] text-[#8B929A] mt-2 font-mono">Measures visual confirmation that the user sees layout loads commencing.</p>
            </div>
          </div>

          {/* Asset Load Status Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative group">
              <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-[#E5E7EB] flex items-center gap-1.5">
                  <Image size={15} className="text-[#26F0C4]" />
                  Public Load Assets Failures
                  <MetricExplainer 
                    title="Load Assets Failures"
                    description="Monitors runtime loading of files like profile graphics, portfolio screenshots, on-canvas models, and Google Web Fonts."
                    nominalRange="0 failures"
                  />
                </h3>
                <span className="text-[10px] text-rose-500 font-mono font-semibold">SRE Alert Line</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl">
                  <span className="text-[10px] text-[#8B929A] font-mono block uppercase">Images Failed</span>
                  <span className="text-xl font-black text-rose-500 font-mono block mt-1">{telemetry.performance.imageFailures}</span>
                </div>
                <div className="p-3 bg-[#0A0C0E]/50 border border-[#1F2225]/45 rounded-xl">
                  <span className="text-[10px] text-[#8B929A] font-mono block uppercase">Fonts Warnings</span>
                  <span className="text-xl font-black text-amber-500 font-mono block mt-1">{telemetry.performance.fontIssues}</span>
                </div>
              </div>
              <p className="text-[10px] text-[#8B929A] mt-3 leading-normal">
                Slow image payloads or broken cross-origin font CDNs logged dynamically by browser diagnostic beacons.
              </p>
            </div>

            <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 text-left relative group">
              <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-[#E5E7EB] flex items-center gap-1.5">
                  <FileCode size={15} className="text-blue-400" />
                  Production Bundle Size Trend
                  <MetricExplainer 
                    title="Webpack/Vite Bundle Sizing"
                    description="Extracts the total serialized static JavaScript + CSS weight of active production builds, highlighting tree-shaking efficacy."
                    nominalRange="< 450 KB optimal"
                  />
                </h3>
                <span className="text-[10px] text-blue-400 font-mono font-bold">Build Watchdog</span>
              </div>
              <div className="space-y-2">
                {telemetry.performance.bundleTrends.map(b => (
                  <div key={b.date} className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#8B929A]">{b.date} release</span>
                    <span className="text-[#E5E7EB] font-bold">{b.sizeKb} KB</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#8B929A] mt-4 leading-normal font-mono">
                Ensures that Vite script splitting successfully prevents un-needed bundle weights.
              </p>
            </div>
          </div>
        </div>

        {/* Vercel deployment performance tracker */}
        <div className="lg:col-span-1 space-y-6 text-left">
          <div className="bg-[#141719] border border-[#1F2225] rounded-3xl p-6 flex flex-col justify-between h-full relative group">
            <div>
              <div className="flex justify-between items-center border-b border-[#1F2225]/45 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-[#E5E7EB] flex items-center gap-1">
                  Vercel Deployment Impact
                  <MetricExplainer 
                    title="Active Deployment Health" 
                    description="Triggers comparative metric loads between the current active release and previous deployment states on Cloud Run / Vercel edges."
                    nominalRange="Low variance standard"
                  />
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono text-[#8B929A] uppercase">Active Release</p>
                  <p className="text-sm font-extrabold text-blue-400 font-mono mt-0.5">{telemetry.deployment.activeVersion}</p>
                </div>

                <div>
                  <p className="text-[10px] font-mono text-[#8B929A] uppercase">Deployment Date</p>
                  <p className="text-xs font-bold text-[#E5E7EB] mt-0.5">
                    {new Date(telemetry.deployment.activeDeployDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <span className="text-[9px] font-mono text-[#8B929A] block uppercase">Network Performance Impact</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                    {telemetry.deployment.latencyDeltaPct}%
                  </div>
                  <span className="text-[9px] text-[#8B929A] block mt-1">Average load: {telemetry.deployment.afterMs}ms (vs {telemetry.deployment.beforeMs}ms prior)</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] font-mono text-[#8B929A] border-t border-[#1F2225]/45 mt-4 pt-3 text-center">
              Observer updates pipeline nominal
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default PerformanceTab;
