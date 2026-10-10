import React from 'react';
import { Layers, ArrowDown, Cpu, Radio, Zap, ShieldCheck, Database, GitBranch } from 'lucide-react';

export const SystemArchitecture: React.FC = () => {
  const pipelineSteps = [
    {
      level: 'LEVEL 01',
      title: 'Primary Energy Harvesting & Bulk Generation',
      nodes: ['North Solar Array (450 MW)', 'Offshore Wind Farm (520 MW)', 'Alpine Hydro Dam (600 MW)', 'BESS Storage Banks'],
      desc: 'Physical power generation produces variable, weather-dependent AC/DC electricity injecting into high-voltage busbars.',
      icon: <Zap className="w-4 h-4 text-cyan-500" />,
      accent: 'border-cyan-200 bg-cyan-50/50',
    },
    {
      level: 'LEVEL 02',
      title: 'Physical Interconnected Smart Grid Topology',
      nodes: ['230kV / 400kV Transmission Corridors', 'Step-down Substations', 'Distribution Feeders', 'Meshed Cross-ties'],
      desc: 'Meshed electrical physical graph obeying Kirchhoff’s Current Law and thermal transformer ratings.',
      icon: <Layers className="w-4 h-4 text-blue-500" />,
      accent: 'border-blue-200 bg-blue-50/50',
    },
    {
      level: 'LEVEL 03',
      title: 'Decentralized Multi-Agent Sensing Layer',
      nodes: ['AG-01 (Frequency)', 'AG-02 (Dispatcher)', 'AG-03 (Storage Manager)', 'AG-04 (Load Balancer)'],
      desc: 'Autonomous micro-agents collocated at substations and microgrid controllers sampling bus voltage, current, and load ratios.',
      icon: <Cpu className="w-4 h-4 text-indigo-500" />,
      accent: 'border-indigo-200 bg-indigo-50/50',
    },
    {
      level: 'LEVEL 04',
      title: 'Environmental Signal & Digital Pheromone Lattice',
      nodes: ['Demand Pheromones (τ_sink)', 'Surplus Waves (τ_source)', 'Congestion Repulsion (τ_choke)', 'Spatial Diffusion ∇²τ'],
      desc: 'The shared digital environment. Instead of point-to-point IP packets, agents mutate local state values that diffuse across the grid lattice.',
      icon: <Radio className="w-4 h-4 text-amber-500" />,
      accent: 'border-amber-200 bg-amber-50/50',
    },
    {
      level: 'LEVEL 05',
      title: 'Localized Decision & Dynamic Flow Redistribution',
      nodes: ['Impedance Modulation', 'BESS Ramp Discharge', 'Multi-Path Power Dispatch', 'Transformer Load Shedding'],
      desc: 'Nearby agents execute gradient ascent along high-intensity signal trails, diverting power toward sinks and away from bottlenecks.',
      icon: <GitBranch className="w-4 h-4 text-purple-500" />,
      accent: 'border-purple-200 bg-purple-50/50',
    },
    {
      level: 'LEVEL 06',
      title: 'Self-Organized Dynamic Grid Equilibrium',
      nodes: ['50.00 Hz Frequency Lock', 'Line Loading < 75%', 'Voltage Profile 1.00 ± 0.03 p.u.', 'Zero Single Point of Failure'],
      desc: 'Signals naturally evaporate as distress eases (τ → 0), restoring nominal baseline without central oversight.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      accent: 'border-emerald-200 bg-emerald-50/50',
    },
  ];

  return (
    <section id="architecture" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="space-y-2 border-b border-slate-200 pb-5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Formal Systems Architecture</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">IEEE Microgrid Standard & Ant Colony Optimization</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            End-to-End Stigmergic Control Pipeline
          </h2>
          <p className="text-sm text-slate-600">
            A 6-tier vertical architecture bridging high-voltage physical electrodynamics with biologically-inspired decentralized multi-agent coordination.
          </p>
        </div>

        {/* Vertical Architecture Diagram */}
        <div className="space-y-3">
          {pipelineSteps.map((step, idx) => (
            <React.Fragment key={step.level}>
              <div className={`p-5 rounded-lg border ${step.accent} transition-all hover:shadow-sm`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Level & Title */}
                  <div className="space-y-1 lg:w-1/3">
                    <div className="flex items-center gap-2">
                      {step.icon}
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        {step.level}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {step.desc}
                    </p>
                  </div>

                  {/* Right: Key System Components */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {step.nodes.map((n) => (
                      <div
                        key={n}
                        className="px-2.5 py-1.5 bg-white rounded border border-slate-200 text-xs font-mono text-slate-700 font-medium truncate text-center shadow-xs"
                      >
                        {n}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Connecting Down Arrow between levels */}
              {idx < pipelineSteps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mathematical Foundations Panel */}
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
              Mathematical Formalization
            </span>
            <h3 className="text-lg font-bold text-white">
              Stigmergic Pheromone Diffusion & Stochastic Dispatch Probability
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            
            {/* Equation 1: Temporal Evaporation and Deposition */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[11px] text-cyan-400 font-bold">
                1. PHEROMONE STATE UPDATE RULE
              </div>
              <div className="text-base sm:text-lg font-bold text-white py-2 text-center bg-slate-900 rounded border border-slate-800">
                τᵢⱼ(t + 1) = (1 - ρ) · τᵢⱼ(t) + Σₖ Δτᵢⱼᵏ(t)
              </div>
              <ul className="space-y-1 text-slate-400 text-[11px] pt-1">
                <li>• <strong>ρ ∈ (0, 1):</strong> Pheromone evaporation rate (decay factor prevents permanent lock-in)</li>
                <li>• <strong>Δτᵢⱼᵏ:</strong> Quantity of pheromone deposited by agent k across corridor (i, j)</li>
                <li>• <strong>τᵢⱼ(t):</strong> Instantaneous environmental intensity matrix</li>
              </ul>
            </div>

            {/* Equation 2: Transition Probability (Ant Colony Optimization variant for AC Power Flow) */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[11px] text-amber-400 font-bold">
                2. AGENT DISPATCH ROUTING PROBABILITY
              </div>
              <div className="text-base sm:text-lg font-bold text-white py-2 text-center bg-slate-900 rounded border border-slate-800">
                Pᵢⱼ = [τᵢⱼ]ᵅ · [ηᵢⱼ]ᵝ / Σₗ ([τᵢₗ]ᵅ · [ηᵢₗ]ᵝ)
              </div>
              <ul className="space-y-1 text-slate-400 text-[11px] pt-1">
                <li>• <strong>ηᵢⱼ = 1 / Zᵢⱼ:</strong> Heuristic physical transmission admittance (inverse impedance)</li>
                <li>• <strong>α, β:</strong> Weight parameters balancing environmental stigmergy vs physical electrical constraints</li>
                <li>• <strong>Pᵢⱼ:</strong> Probability that agent routes excess MW via neighbor node j</li>
              </ul>
            </div>

          </div>

          <div className="p-3 bg-blue-950/40 rounded border border-blue-900/60 text-xs text-blue-200">
            <strong>Theoretical Guarantee: </strong>
            Because the state variables reside in the physical/digital grid nodes rather than in transient network communication queues, the system is mathematically guaranteed to remain functional even in the presence of severe packet loss or high electromagnetic interference (EMI).
          </div>
        </div>

      </div>
    </section>
  );
};
