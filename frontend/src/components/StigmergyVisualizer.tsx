import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Share2, 
  Cpu, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  Pause,
  AlertTriangle,
  Flame,
  Gauge
} from 'lucide-react';
import { PheromoneType } from '../types/grid';

interface StigmergyVisualizerProps {
  onTriggerSurge: () => void;
  onInjectSignal: (nodeId: string, type: PheromoneType) => void;
}

export const StigmergyVisualizer: React.FC<StigmergyVisualizerProps> = ({
  onTriggerSurge,
  onInjectSignal,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const steps = [
    {
      stepNumber: '01',
      title: 'Localized Environmental Sensing',
      agent: 'AGENT-04 (Substation Load Monitor)',
      location: 'ZONE-07 (Heavy Industrial Complex)',
      condition: 'Demand surge (+18.4% above predicted transformer rating)',
      description:
        'The agent does not ping a central master server. It simply measures its own local bus voltage drop and thermal line stress.',
      signalEmitted: 'DEMAND_SIGNAL',
      signalColor: 'text-amber-500',
      badgeColor: 'border-amber-300 bg-amber-50 text-amber-800',
      action: 'Agent registers threshold crossing at local transformer 07.',
    },
    {
      stepNumber: '02',
      title: 'Digital Pheromone Deposition',
      agent: 'AGENT-04',
      location: 'ZONE-07 Local Grid Cell',
      condition: 'Modifying local grid cell state variable τ_07',
      description:
        'Instead of broadcasting packets to other agents, AGENT-04 modifies the shared environment by depositing a digital demand pheromone on its local grid cell.',
      signalEmitted: 'DEMAND_PHEROMONE (τ = 0.94)',
      signalColor: 'text-rose-500',
      badgeColor: 'border-rose-300 bg-rose-50 text-rose-800',
      action: 'State variable updated directly on the physical/digital grid topology.',
    },
    {
      stepNumber: '03',
      title: 'Spatial Diffusion & Temporal Decay',
      agent: 'PHYSICAL ENVIRONMENT (Grid Medium)',
      location: 'ZONE-04, ZONE-05, ZONE-08',
      condition: 'Pheromone gradient diffusion: ∇²τ - λτ',
      description:
        'The deposited signal diffuses across neighboring transmission lines while decaying over time. High concentration indicates urgent nearby deficit; fading trails denote distant capacity.',
      signalEmitted: 'CONGESTION_GRADIENT',
      signalColor: 'text-orange-500',
      badgeColor: 'border-orange-300 bg-orange-50 text-orange-800',
      action: 'Nearby grid cells and feeder buses inherit proportional gradient values.',
    },
    {
      stepNumber: '04',
      title: 'Indirect Swarm Detection',
      agent: 'AGENT-02 (Energy Distributor) & AGENT-03 (Storage Manager)',
      location: 'ZONE-04 & ZONE-05',
      condition: 'Detecting rising gradient: ∂τ/∂x > 0',
      description:
        'Nearby autonomous agents inspect their local environment and detect the rising pheromone gradient. They have no prior direct communication with AGENT-04.',
      signalEmitted: 'GRADIENT_RECOGNITION',
      signalColor: 'text-blue-600',
      badgeColor: 'border-blue-300 bg-blue-50 text-blue-800',
      action: 'Agents sense the gradient slope pointing towards Zone 07.',
    },
    {
      stepNumber: '05',
      title: 'Autonomous Flow Rerouting',
      agent: 'AGENT-02 & AGENT-03',
      location: 'Corridors 04-07 & 05-08',
      condition: 'Dispatch probability P_ij proportional to [τ_ij]^α · [η_ij]^β',
      description:
        'AGENT-02 switches transmission line impedance to channel 45 MW toward Zone 07. Simultaneously, AGENT-03 commands BESS Mega-Storage to ramp discharge.',
      signalEmitted: 'FLOW_ADAPTATION',
      signalColor: 'text-emerald-600',
      badgeColor: 'border-emerald-300 bg-emerald-50 text-emerald-800',
      action: 'Energy flows autonomously toward the virtual pheromone well.',
    },
    {
      stepNumber: '06',
      title: 'Equilibrium & Signal Evaporation',
      agent: 'SWARM CONVERGENCE',
      location: 'ENTIRE REGIONAL GRID',
      condition: 'Thermal balance restored (72% nominal load)',
      description:
        'As power arrives, Zone 07 stabilizes. The demand pheromone naturally evaporates (τ → 0). The grid returns to tranquil steady-state without manual operator intervention.',
      signalEmitted: 'STEADY_STATE_NOMINAL',
      signalColor: 'text-blue-500',
      badgeColor: 'border-blue-300 bg-blue-50 text-blue-800',
      action: 'Dynamic equilibrium reached through pure environmental feedback.',
    },
  ];

  // Auto-play steps
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  return (
    <section id="stigmergy" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-semibold tracking-wider uppercase">
              <Radio className="w-3.5 h-3.5" />
              </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Stigmergic Coordination Through the Grid Medium
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In nature, social insects coordinate complex infrastructure without a queen issuing commands—they modify the physical ground. In our architecture, <strong className="text-slate-900">the electrical grid itself is the communication channel</strong>. Agents leave digital traces (pheromones) directly in local grid state matrices.
            </p>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{isPlaying ? 'Pause Cycle' : 'Auto Step'}</span>
            </button>
            <button
              onClick={() => {
                setActiveStep(0);
                onTriggerSurge();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Demonstration</span>
            </button>
          </div>
        </div>

        {/* The 6-Step Visual Process Timeline */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((s, index) => {
            const isCurrent = activeStep === index;
            const isPassed = activeStep > index;

            return (
              <button
                key={s.stepNumber}
                onClick={() => {
                  setActiveStep(index);
                  setIsPlaying(false);
                }}
                className={`text-left p-3 rounded-lg border transition-all duration-200 relative ${
                  isCurrent
                    ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500'
                    : isPassed
                    ? 'bg-slate-50 border-slate-300 hover:bg-slate-100'
                    : 'bg-white border-slate-200 hover:border-slate-300 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                  <span className={isCurrent ? 'text-blue-700 font-bold' : ''}>PHASE {s.stepNumber}</span>
                  {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {s.title}
                </h4>
              </button>
            );
          })}
        </div>

        {/* Detailed Visual Exploded Canvas for Current Active Step */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900 text-white p-6 sm:p-8 rounded-xl border border-slate-800 shadow-xl">
          
          {/* Left Diagram: Animated State Graph of the Step */}
          <div className="lg:col-span-6 relative bg-slate-950 p-6 rounded-lg border border-slate-800 overflow-hidden min-h-[320px] flex flex-col justify-between">
            <div className="absolute inset-0 tech-grid-pattern-dark opacity-30 pointer-events-none" />

            {/* Header info inside diagram */}
            <div className="flex items-center justify-between z-10 text-[11px] font-mono">
              <span className="text-slate-400">PHASE {steps[activeStep].stepNumber} // RECEPTOR TELEMETRY</span>
              <span className="text-blue-400 font-semibold">{steps[activeStep].signalEmitted}</span>
            </div>

            {/* Interactive SVG Diagram representing the environmental step */}
            <div className="relative py-8 z-10 flex items-center justify-center">
              <svg viewBox="0 0 400 180" className="w-full h-44">
                {/* Connecting Links */}
                <line x1="80" y1="90" x2="200" y2="90" stroke={activeStep >= 2 ? "#38BDF8" : "#334155"} strokeWidth="2.5" strokeDasharray={activeStep === 2 ? "4 4" : "none"} />
                <line x1="200" y1="90" x2="320" y2="90" stroke={activeStep >= 4 ? "#10B981" : "#334155"} strokeWidth="3" />
                
                {/* Secondary Cross-feeder */}
                <line x1="200" y1="90" x2="200" y2="160" stroke="#334155" strokeWidth="1.5" />
                <line x1="80" y1="90" x2="140" y2="20" stroke="#334155" strokeWidth="1.5" />

                {/* Pheromone Diffusion Wave on Step 2 or 3 */}
                {(activeStep === 1 || activeStep === 2 || activeStep === 3) && (
                  <>
                    <circle cx="80" cy="90" r="32" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.6">
                      <animate attributeName="r" values="20;55" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="80" cy="90" r="48" fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="r" values="30;70" dur="1.8s" begin="0.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0" dur="1.8s" begin="0.5s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}

                {/* Energy Flow Animation on Step 4 and 5 */}
                {(activeStep >= 4) && (
                  <circle r="4" fill="#38BDF8">
                    <animateMotion path="M 320 90 L 200 90 L 80 90" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Node 1: Deficit / Demand Source */}
                <g transform="translate(80, 90)">
                  <circle r="18" fill="#1E293B" stroke={activeStep >= 1 && activeStep <= 3 ? "#EF4444" : "#3B82F6"} strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">Z-07</text>
                  <text y="30" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">Load Center</text>
                </g>

                {/* Node 2: Intermediate Grid Router */}
                <g transform="translate(200, 90)">
                  <circle r="18" fill="#1E293B" stroke={activeStep >= 3 ? "#F59E0B" : "#334155"} strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">Z-04</text>
                  <text y="30" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">Substation</text>
                </g>

                {/* Node 3: Upstream Supply / Storage */}
                <g transform="translate(320, 90)">
                  <circle r="18" fill="#1E293B" stroke={activeStep >= 4 ? "#10B981" : "#334155"} strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">Z-05</text>
                  <text y="30" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">BESS Storage</text>
                </g>

                {/* Agent Token Display */}
                <g transform={`translate(${activeStep <= 2 ? 80 : activeStep === 3 ? 200 : 320}, 45)`}>
                  <rect x="-24" y="-12" width="48" height="20" rx="3" fill="#2563EB" stroke="#60A5FA" strokeWidth="1" />
                  <text y="2" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    {activeStep <= 2 ? 'AG-04' : activeStep === 3 ? 'AG-02' : 'AG-03'}
                  </text>
                </g>
              </svg>
            </div>

            {/* Bottom telemetry indicators */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 z-10">
              <div>
                <span>LOCAL GRADIENT:</span>
                <span className="text-white ml-1 font-bold">
                  {activeStep === 0 ? '0.12' : activeStep === 1 ? '0.94' : activeStep === 2 ? '0.78' : activeStep === 3 ? '0.65' : activeStep === 4 ? '0.40' : '0.05'}
                </span>
              </div>
              <div>
                <span>DECAY RATE (λ):</span>
                <span className="text-blue-300 ml-1">0.08 s⁻¹</span>
              </div>
              <div>
                <span>DISPATCH LATENCY:</span>
                <span className="text-emerald-400 ml-1 font-bold">140 ms</span>
              </div>
            </div>
          </div>

          {/* Right Explanation Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
                Step {steps[activeStep].stepNumber} Detailed Mechanism
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {steps[activeStep].title}
              </h3>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Acting Entity:</span>
                <span className="text-blue-300 font-semibold">{steps[activeStep].agent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Physical Zone:</span>
                <span className="text-slate-200">{steps[activeStep].location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trigger Condition:</span>
                <span className="text-amber-300">{steps[activeStep].condition}</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {steps[activeStep].description}
            </p>

            <div className="p-3 bg-blue-950/40 rounded border border-blue-900/60 text-xs text-blue-200">
              <strong className="text-blue-300 font-semibold">Stigmergic Invariant: </strong>
              {steps[activeStep].action}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={activeStep === 0}
                onClick={() => {
                  setActiveStep((prev) => Math.max(0, prev - 1));
                  setIsPlaying(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 disabled:opacity-30 rounded border border-slate-700"
              >
                Previous Step
              </button>

              <button
                disabled={activeStep === steps.length - 1}
                onClick={() => {
                  setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
                  setIsPlaying(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded flex items-center gap-1.5 shadow"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

        {/* Smart Grid Environmental Signals */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Smart Grid Environmental Signals
            </h3>
            <p className="text-xs text-slate-600">
              Signals are state variables mapped to transmission buses and spatial zones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                type: 'DEMAND_SIGNAL',
                dot: 'bg-red-500',
                title: 'Demand',
                badge: 'Sinks',
                desc: 'Emitted when transformer load exceeds 85% or bus voltage drops below 0.95 p.u.',
                effect: 'Raises routing attraction',
              },
              {
                type: 'ENERGY_SURPLUS',
                dot: 'bg-cyan-500',
                title: 'Surplus',
                badge: 'Sources',
                desc: 'Emitted by solar and wind during sudden generation peaks. Alerts BESS chargers.',
                effect: 'Forms a high-potential gradient',
              },
              {
                type: 'CONGESTION_GRADIENT',
                dot: 'bg-amber-500',
                title: 'Congestion',
                badge: 'Lines',
                desc: 'Deposited on corridors near thermal limits. Deflects flow onto alternative paths.',
                effect: 'Penalizes transmission weights',
              },
              {
                type: 'PRIORITY_DISPATCH',
                dot: 'bg-blue-600',
                title: 'Priority Reserve',
                badge: 'Critical',
                desc: 'Permanent marker at hospitals and critical pumps to guarantee reserve power.',
                effect: 'Non-evaporating barrier',
              },
              {
                type: 'LOAD_PRESSURE',
                dot: 'bg-orange-500',
                title: 'Load Pressure',
                badge: 'EV / Commercial',
                desc: 'Aggregated EV charger signals forecasting demand ramps 15 minutes ahead.',
                effect: 'Pre-biases BESS readiness',
              },
              {
                type: 'AVAILABLE_CAPACITY',
                dot: 'bg-emerald-500',
                title: 'Storage Capacity',
                badge: 'BESS',
                desc: 'Broadcast by batteries with SOC above 80% ready to absorb surges.',
                effect: 'Absorbs transient surges',
              },
            ].map((sig) => (
              <div
                key={sig.type}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sig.dot}`} />
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {sig.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {sig.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{sig.desc}</p>
                <p className="text-[11px] font-mono text-slate-500">
                  <span className="text-slate-400">Effect:</span> {sig.effect}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
