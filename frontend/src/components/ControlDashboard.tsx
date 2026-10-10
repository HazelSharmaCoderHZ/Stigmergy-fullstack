import React, { useMemo } from 'react';
import { SystemMetrics } from '../types/grid';
import { 
  Zap, 
  Gauge, 
  TrendingUp, 
  Activity,
} from 'lucide-react';

interface ControlDashboardProps {
  metrics: SystemMetrics;
  history: Array<{ timestamp: string; generation: number; demand: number }>;
  backendStatus?: 'connecting' | 'connected' | 'error';
  backendError?: string;
}

export const ControlDashboard: React.FC<ControlDashboardProps> = ({
  metrics,
  history,
  backendStatus,
  backendError = '',
}) => {
  const timeSeriesData = history;

  // Max scale for SVG chart
  const maxMW = Math.max(1, ...timeSeriesData.flatMap((point) => [point.generation, point.demand]), metrics.totalGenerationMW ?? 0, metrics.totalDemandMW ?? 0) * 1.1;
  const chartHeight = 160;
  const chartWidth = 560;

  return (
    <section id="analytics" className="scroll-mt-20 border-b border-slate-200 bg-white py-10 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-700">
              <span>LIVE SYSTEM MEASUREMENTS</span>
              <span className="text-slate-500">IEEE-14 measurements</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">
              System overview
            </h2>
          </div>

          {/* Inline connection state (dashboard-level only, not a global strip) */}
          <div className="text-right text-[11px] font-mono">
            {backendStatus === 'connecting' && (
              <span className="text-amber-700">Connecting to backend…</span>
            )}
            {backendStatus === 'error' && (
              <span className="text-red-700">Backend unreachable: {backendError}</span>
            )}
          </div>
        </div>

        {/* Backend-reported system measurements */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-y border-slate-200">
          
          {/* 1. Total Generation */}
          <div className="border-b border-r border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>TOTAL SUPPLY</span>
              <Zap className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-slate-950 tabular-nums">
                {metrics.totalGenerationMW?.toFixed(2) ?? '—'}
              </span>
              <span className="text-xs font-mono text-slate-500">MW</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <span>IEEE-14 power-flow result</span>
            </div>
          </div>

          {/* 2. Total Demand */}
          <div className="border-b border-r border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>SYSTEM DEMAND</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-slate-950 tabular-nums">
                {metrics.totalDemandMW?.toFixed(2) ?? '—'}
              </span>
              <span className="text-xs font-mono text-slate-500">MW</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Current backend snapshot
            </div>
          </div>

          {/* 3. Grid Efficiency */}
          <div className="border-b border-r border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>VOLTAGE RANGE</span>
              <Gauge className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-slate-950 tabular-nums">
                {metrics.minVoltagePU?.toFixed(3) ?? '—'} to {metrics.maxVoltagePU?.toFixed(3) ?? '—'} pu
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {metrics.converged === undefined ? 'Awaiting backend' : metrics.converged ? 'Power flow converged' : 'Power flow not converged'}
            </div>
          </div>

          {/* Measured maximum line loading */}
          <div className="border-b border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>MAX LINE LOADING</span>
              <Activity className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-slate-950 tabular-nums">
                {metrics.maxLineLoadingPercent?.toFixed(1) ?? '—'}%
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              IEEE-14 line result
            </div>
          </div>

        </div>

        {/* Generation and demand history */}
        <div className="grid grid-cols-1 gap-5">
          
          {/* Left Major Graph: Energy Generation vs Load Demand Curve (Dual-Axis SVG) */}
          <div className="border-y border-slate-200 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-950 flex items-center gap-2">
                  <span>Generation and demand history</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Current-session samples from the backend; historical scenario data is not available.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-cyan-700" />
                  <span className="text-slate-600">Generation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-blue-400 border-dashed" />
                  <span className="text-slate-600">Demand</span>
                </div>
              </div>
            </div>

            {/* High-Precision SVG Graph */}
            <div className="relative w-full h-48 bg-white border border-slate-200 p-2 overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                  const val = Math.round(maxMW * fraction);
                  const y = chartHeight - (fraction * chartHeight);
                  return (
                    <g key={val}>
                      <line x1="40" y1={y} x2={chartWidth - 10} y2={y} stroke="#E2E8F0" strokeWidth="1" />
                      <text x="35" y={y + 3} textAnchor="end" fill="#64748B" fontSize="9" fontFamily="monospace">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Hour lines */}
                {timeSeriesData.map((d, i) => {
                  const stepX = (chartWidth - 60) / Math.max(timeSeriesData.length - 1, 1);
                  const x = 50 + i * stepX;
                  return (
                    <g key={d.timestamp}>
                      <line x1={x} y1="0" x2={x} y2={chartHeight - 15} stroke="#E2E8F0" strokeWidth="0.8" />
                      <text x={x} y={chartHeight - 3} textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="monospace">
                        {d.timestamp}
                      </text>
                    </g>
                  );
                })}

                {/* Generation Area & Line (Cyan) */}
                <path
                  d={timeSeriesData.reduce((acc, d, i) => {
                    const stepX = (chartWidth - 60) / Math.max(timeSeriesData.length - 1, 1);
                    const x = 50 + i * stepX;
                    const y = chartHeight - 15 - (d.generation / maxMW) * (chartHeight - 20);
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#0E7490"
                  strokeWidth="2.5"
                />

                {/* Demand Line (Amber dashed) */}
                <path
                  d={timeSeriesData.reduce((acc, d, i) => {
                    const stepX = (chartWidth - 60) / Math.max(timeSeriesData.length - 1, 1);
                    const x = 50 + i * stepX;
                    const y = chartHeight - 15 - (d.demand / maxMW) * (chartHeight - 20);
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />

                {/* Live Current Point Indicator */}
                {timeSeriesData.length > 0 && (() => {
                  const lastIdx = timeSeriesData.length - 1;
                  const stepX = (chartWidth - 60) / Math.max(timeSeriesData.length - 1, 1);
                  const x = 50 + lastIdx * stepX;
                  const latest = timeSeriesData[lastIdx];
                  const yGen = chartHeight - 15 - (latest.generation / maxMW) * (chartHeight - 20);
                  const yDem = chartHeight - 15 - (latest.demand / maxMW) * (chartHeight - 20);
                  return (
                    <g>
                      <circle cx={x} cy={yGen} r="4" fill="#0E7490" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx={x} cy={yDem} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                    </g>
                  );
                })()}
                {timeSeriesData.length === 0 && (
                  <text x="280" y="80" textAnchor="middle" fill="#94A3B8" fontSize="11" fontFamily="monospace">
                    Waiting for backend snapshots
                  </text>
                )}
              </svg>
            </div>

            {/* Bottom summary note */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
              <span>Generation minus demand: <strong className="text-slate-900">{metrics.totalGenerationMW !== undefined && metrics.totalDemandMW !== undefined ? `${(metrics.totalGenerationMW - metrics.totalDemandMW).toFixed(2)} MW` : '—'}</strong></span>
              <span>Snapshots collected during this session</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
