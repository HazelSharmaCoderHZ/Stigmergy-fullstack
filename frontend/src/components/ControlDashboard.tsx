import React, { useState, useMemo } from 'react';
import { GridNode, SystemMetrics, PheromoneType } from '../types/grid';
import { 
  Zap, 
  Activity, 
  Gauge, 
  Cpu, 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Maximize2,
  Clock
} from 'lucide-react';

interface ControlDashboardProps {
  metrics: SystemMetrics;
  nodes: GridNode[];
  onSelectNode: (node: GridNode | null) => void;
}

export const ControlDashboard: React.FC<ControlDashboardProps> = ({
  metrics,
  nodes,
  onSelectNode,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'realtime' | '24h' | '7d'>('realtime');
  const [activeZoneFilter, setActiveZoneFilter] = useState<string>('all');

  // Simulated 24-hour demand vs generation curve data points (0h to 24h)
  const timeSeriesData = useMemo(() => [
    { hour: '00:00', generation: 920, demand: 810, solar: 0, wind: 480, hydro: 440 },
    { hour: '03:00', generation: 860, demand: 750, solar: 0, wind: 460, hydro: 400 },
    { hour: '06:00', generation: 1050, demand: 980, solar: 140, wind: 490, hydro: 420 },
    { hour: '09:00', generation: 1480, demand: 1320, solar: 580, wind: 450, hydro: 450 },
    { hour: '12:00', generation: 1820, demand: 1540, solar: 880, wind: 420, hydro: 520 },
    { hour: '15:00', generation: 1740, demand: 1610, solar: 790, wind: 440, hydro: 510 },
    { hour: '18:00', generation: 1620, demand: 1690, solar: 220, wind: 510, hydro: 590 },
    { hour: '21:00', generation: 1340, demand: 1380, solar: 0, wind: 530, hydro: 550 },
    { hour: 'Now', generation: metrics.totalGenerationMW, demand: metrics.totalDemandMW, solar: 420, wind: 480, hydro: 550 },
  ], [metrics.totalDemandMW, metrics.totalGenerationMW]);

  // Max scale for SVG chart
  const maxMW = 2000;
  const chartHeight = 160;
  const chartWidth = 560;

  // Filtered zones
  const sortedZones = useMemo(() => {
    return [...nodes].sort((a, b) => b.currentLoad - a.currentLoad);
  }, [nodes]);

  // Mathematical Pheromone Exponential Decay Curve Points (0s to 12s)
  const decayPoints = useMemo(() => {
    const points = [];
    const lambda = 0.18; // decay constant
    for (let t = 0; t <= 12; t += 0.5) {
      const tau = Math.exp(-lambda * t);
      points.push({ t, tau });
    }
    return points;
  }, []);

  return (
    <section id="analytics" className="py-16 bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>CONTROL ROOM REAL-TIME TELEMETRY</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">ISO-NE / PJM COMPATIBLE METRICS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Grid Intelligence Overview
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs font-mono">
            <span className="px-2 py-1 text-slate-400 text-[11px]">TIMEFRAME:</span>
            {(['realtime', '24h', '7d'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedTimeRange(mode)}
                className={`px-2.5 py-1 rounded text-[11px] uppercase transition-colors ${
                  selectedTimeRange === mode
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Top 6 Precision Operational Metric Tiles with Visual Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* 1. Total Generation */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>TOTAL SUPPLY</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {metrics.totalGenerationMW}
              </span>
              <span className="text-xs font-mono text-slate-400">MW</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span>+6.4% reserve margin</span>
            </div>
          </div>

          {/* 2. Total Demand */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SYSTEM DEMAND</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {metrics.totalDemandMW}
              </span>
              <span className="text-xs font-mono text-slate-400">MW</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Peak: 1,690 MW at 18:00
            </div>
          </div>

          {/* 3. Grid Efficiency */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>GRID EFFICIENCY</span>
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {metrics.gridEfficiency}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics.gridEfficiency}%` }} />
            </div>
          </div>

          {/* 4. Active Swarm Agents */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>ACTIVE AGENTS</span>
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {metrics.activeAgentsCount}
              </span>
              <span className="text-xs font-mono text-slate-400">Units</span>
            </div>
            <div className="text-[10px] font-mono text-blue-300">
              All 6 swarms synchronized
            </div>
          </div>

          {/* 5. Stigmergic Signal Density */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SIGNAL DENSITY</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
                {(metrics.signalDensity * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Active traces: 14 channels
            </div>
          </div>

          {/* 6. Grid Frequency */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>BUS FREQUENCY</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {metrics.frequencyHz.toFixed(3)}
              </span>
              <span className="text-xs font-mono text-slate-400">Hz</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400">
              Δf: +0.018 Hz (Nominal 50.000)
            </div>
          </div>

        </div>

        {/* Engineering Research Graphs: 2 Major Visualization Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Major Graph: Energy Generation vs Load Demand Curve (Dual-Axis SVG) */}
          <div className="lg:col-span-7 bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span>Real-Time Generation vs. Dynamic Load Curve</span>
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Question answered: How does aggregate generation balance against fluctuating regional demand?
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-cyan-400" />
                  <span className="text-slate-300">Generation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-amber-400 border-dashed" />
                  <span className="text-slate-300">Demand</span>
                </div>
              </div>
            </div>

            {/* High-Precision SVG Graph */}
            <div className="relative w-full h-48 bg-slate-900/60 rounded border border-slate-800/80 p-2 overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                {/* Horizontal Grid lines */}
                {[0, 500, 1000, 1500, 2000].map((val) => {
                  const y = chartHeight - (val / maxMW) * chartHeight;
                  return (
                    <g key={val}>
                      <line x1="40" y1={y} x2={chartWidth - 10} y2={y} stroke="#1E293B" strokeWidth="1" />
                      <text x="35" y={y + 3} textAnchor="end" fill="#64748B" fontSize="9" fontFamily="monospace">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Hour lines */}
                {timeSeriesData.map((d, i) => {
                  const stepX = (chartWidth - 60) / (timeSeriesData.length - 1);
                  const x = 50 + i * stepX;
                  return (
                    <g key={d.hour}>
                      <line x1={x} y1="0" x2={x} y2={chartHeight - 15} stroke="#1E293B" strokeWidth="0.8" />
                      <text x={x} y={chartHeight - 3} textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="monospace">
                        {d.hour}
                      </text>
                    </g>
                  );
                })}

                {/* Generation Area & Line (Cyan) */}
                <path
                  d={timeSeriesData.reduce((acc, d, i) => {
                    const stepX = (chartWidth - 60) / (timeSeriesData.length - 1);
                    const x = 50 + i * stepX;
                    const y = chartHeight - 15 - (d.generation / maxMW) * (chartHeight - 20);
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                />

                {/* Demand Line (Amber dashed) */}
                <path
                  d={timeSeriesData.reduce((acc, d, i) => {
                    const stepX = (chartWidth - 60) / (timeSeriesData.length - 1);
                    const x = 50 + i * stepX;
                    const y = chartHeight - 15 - (d.demand / maxMW) * (chartHeight - 20);
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />

                {/* Live Current Point Indicator */}
                {(() => {
                  const lastIdx = timeSeriesData.length - 1;
                  const stepX = (chartWidth - 60) / (timeSeriesData.length - 1);
                  const x = 50 + lastIdx * stepX;
                  const yGen = chartHeight - 15 - (metrics.totalGenerationMW / maxMW) * (chartHeight - 20);
                  const yDem = chartHeight - 15 - (metrics.totalDemandMW / maxMW) * (chartHeight - 20);
                  return (
                    <g>
                      <circle cx={x} cy={yGen} r="4" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx={x} cy={yDem} r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Bottom summary note */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
              <span>NET POWER IMBALANCE: <strong className="text-emerald-400">+160 MW (Surplus Exported to BESS)</strong></span>
              <span>UPDATE INTERVAL: 1,000 ms</span>
            </div>
          </div>

          {/* Right Graph: Stigmergic Pheromone Diffusion & Evaporation Curve */}
          <div className="lg:col-span-5 bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Pheromone Decay & Gradient Evaporation</span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Mathematical Model: τ(t) = τ₀ · e^(-λt) where λ = 0.18 s⁻¹
              </p>
            </div>

            {/* Exponential Decay Graph */}
            <div className="relative w-full h-48 bg-slate-900/60 rounded border border-slate-800/80 p-2 overflow-hidden">
              <svg viewBox="0 0 320 160" className="w-full h-full">
                {/* Axes */}
                <line x1="35" y1="15" x2="35" y2="140" stroke="#334155" strokeWidth="1" />
                <line x1="35" y1="140" x2="305" y2="140" stroke="#334155" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="30" y="22" textAnchor="end" fill="#64748B" fontSize="8" fontFamily="monospace">1.0</text>
                <text x="30" y="82" textAnchor="end" fill="#64748B" fontSize="8" fontFamily="monospace">0.5</text>
                <text x="30" y="142" textAnchor="end" fill="#64748B" fontSize="8" fontFamily="monospace">0.0</text>

                {/* X-axis labels */}
                <text x="35" y="153" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="monospace">0s</text>
                <text x="125" y="153" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="monospace">4s</text>
                <text x="215" y="153" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="monospace">8s</text>
                <text x="300" y="153" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="monospace">12s</text>

                {/* Area under curve */}
                <path
                  d={`M 35 140 ${decayPoints
                    .map((p) => {
                      const x = 35 + (p.t / 12) * 265;
                      const y = 140 - p.tau * 120;
                      return `L ${x} ${y}`;
                    })
                    .join(' ')} L 300 140 Z`}
                  fill="rgba(6, 182, 212, 0.12)"
                />

                {/* The Decay Curve */}
                <path
                  d={decayPoints.reduce((acc, p, i) => {
                    const x = 35 + (p.t / 12) * 265;
                    const y = 140 - p.tau * 120;
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="2.5"
                />

                {/* Half-life Marker */}
                <line x1="108" y1="80" x2="108" y2="140" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="108" cy="80" r="3" fill="#F59E0B" />
                <text x="114" y="75" fill="#F59E0B" fontSize="8" fontFamily="monospace">
                  t₁/₂ = 3.85s (Half-life)
                </text>
              </svg>
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-cyan-400 font-bold">Stigmergic Invariant: </span>
              Signals naturally vanish unless actively refreshed by ongoing physical distress. Prevents stale routing loops.
            </div>
          </div>

        </div>

        {/* Zone-by-Zone Load & Stress Breakdown */}
        <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">
                Grid Load Pressure by Zone (Transformer Thermal Stress)
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Question answered: Which regional zones are approaching thermal congestion?
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">SORTED BY:</span>
              <span className="text-blue-300 font-semibold">LOAD SEVERITY</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {sortedZones.slice(0, 8).map((zone) => {
              const isCongested = zone.currentLoad >= 85;
              const isWarning = zone.currentLoad >= 70 && zone.currentLoad < 85;

              return (
                <div
                  key={zone.id}
                  onClick={() => onSelectNode(zone)}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    isCongested
                      ? 'bg-rose-950/40 border-rose-800/80 hover:bg-rose-950/60'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-800/70 hover:bg-amber-950/50'
                      : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-300">
                      {zone.zoneCode}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        isCongested
                          ? 'bg-rose-500 text-white animate-pulse'
                          : isWarning
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-600/30 text-blue-300'
                      }`}
                    >
                      {zone.status.toUpperCase()}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white truncate mb-2">{zone.name}</h5>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Thermal Load:</span>
                      <span className={`font-bold tabular-nums ${isCongested ? 'text-rose-400' : 'text-slate-200'}`}>
                        {zone.currentLoad}% ({zone.currentLoadMW} MW)
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isCongested ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${zone.currentLoad}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-0.5">
                      <span>Capacity: {zone.capacityMW} MW</span>
                      <span>Signal: {(zone.pheromoneIntensity * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
