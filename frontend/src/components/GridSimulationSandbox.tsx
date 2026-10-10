import React from 'react';
import { SimulationParams, GridNode } from '../types/grid';
import { Sliders, Play, Pause, FastForward, RotateCcw, AlertOctagon, SunDim, Car, RefreshCw, Zap } from 'lucide-react';

interface GridSimulationSandboxProps {
  params: SimulationParams;
  onChangeParams: (newParams: Partial<SimulationParams>) => void;
  onApplyScenario: (scenarioName: string) => void;
  onResetSimulation: () => void;
}

export const GridSimulationSandbox: React.FC<GridSimulationSandboxProps> = ({
  params,
  onChangeParams,
  onApplyScenario,
  onResetSimulation,
}) => {
  return (
    <section id="simulation" className="py-16 bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Stress-Test Sandbox</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Dynamic Environmental Parameter Manipulation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Grid Simulation & Perturbation Console
            </h2>
            <p className="text-sm text-slate-300">
              Modulate environmental variables in real time. Watch autonomous agents detect changing pheromone gradients and reroute energy without central intervention.
            </p>
          </div>

          {/* Master Run / Speed Controls */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onChangeParams({ isPaused: !params.isPaused })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
                params.isPaused
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-amber-600 text-white hover:bg-amber-500'
              }`}
            >
              {params.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{params.isPaused ? 'RESUME' : 'PAUSE'}</span>
            </button>

            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeParams({ speed: spd })}
                className={`px-2.5 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                  params.speed === spd
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}

            <button
              onClick={onResetSimulation}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset parameters to nominal baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Research Stress Scenarios */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>PRESET EXPERIMENTAL STRESS-TEST SCENARIOS</span>
            <span>CLICK TO INJECT GRID PERTURBATION</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'peak-ev',
                title: 'Peak Evening EV Surge',
                icon: <Car className="w-4 h-4 text-amber-400" />,
                desc: 'Depot-11 & Metro-08 demand spikes +40%. Agents deposit load pressure signals to draw BESS reserves.',
                accent: 'hover:border-amber-400',
              },
              {
                id: 'solar-drop',
                title: 'Solar Intermittency Drop',
                icon: <SunDim className="w-4 h-4 text-orange-400" />,
                desc: 'Sudden cloud cover reduces Solar-01 output by 65%. Storage agents sense deficit and initiate discharge.',
                accent: 'hover:border-orange-400',
              },
              {
                id: 'line-trip',
                title: 'Substation Feeder Tripping',
                icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
                desc: 'Corridor 05-08 trips offline. Congestion pheromones immediately divert power onto secondary mesh corridors.',
                accent: 'hover:border-red-400',
              },
              {
                id: 'steady-state',
                title: 'Nominal Equilibrium',
                icon: <RefreshCw className="w-4 h-4 text-emerald-400" />,
                desc: 'Restore balanced generation and load across all 16 zones. Signals evaporate to baseline tranquility.',
                accent: 'hover:border-emerald-400',
              },
            ].map((scen) => (
              <button
                key={scen.id}
                onClick={() => onApplyScenario(scen.id)}
                className={`p-4 rounded-lg bg-slate-950 border border-slate-800 ${scen.accent} text-left transition-all hover:bg-slate-900 group`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {scen.icon}
                  <span className="text-xs font-bold text-white group-hover:text-blue-300">
                    {scen.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {scen.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Real-Time Parameter Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-950 rounded-xl border border-slate-800">
          
          {/* Slider 1: Regional Demand Multiplier */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">REGIONAL DEMAND</span>
              <span className="text-amber-400 font-bold tabular-nums">
                {(params.demandFactor * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.05"
              value={params.demandFactor}
              onChange={(e) => onChangeParams({ demandFactor: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>50% (Night Light)</span>
              <span>100% (Nominal)</span>
              <span>180% (Heatwave Surge)</span>
            </div>
          </div>

          {/* Slider 2: Renewable Supply Output */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">RENEWABLE GENERATION</span>
              <span className="text-cyan-400 font-bold tabular-nums">
                {(params.renewableSupply * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.7"
              step="0.05"
              value={params.renewableSupply}
              onChange={(e) => onChangeParams({ renewableSupply: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>30% (Low Wind/Sun)</span>
              <span>100% (Forecasted)</span>
              <span>170% (Peak Surplus)</span>
            </div>
          </div>

          {/* Slider 3: Pheromone Evaporation Rate (Decay) */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">SIGNAL DECAY RATE (λ)</span>
              <span className="text-blue-400 font-bold tabular-nums">
                {params.decayRate.toFixed(3)} s⁻¹
              </span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.16"
              step="0.01"
              value={params.decayRate}
              onChange={(e) => onChangeParams({ decayRate: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.02 (Persistent Trails)</span>
              <span>0.08 (Optimal)</span>
              <span>0.16 (Rapid Evaporation)</span>
            </div>
          </div>

          {/* Slider 4: Swarm Agent Density */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">AGENT SWARM DENSITY</span>
              <span className="text-emerald-400 font-bold tabular-nums">
                {params.agentDensity} Units
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={params.agentDensity}
              onChange={(e) => onChangeParams({ agentDensity: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>2 Units (Sparse)</span>
              <span>6 Units (Calibrated)</span>
              <span>10 Units (Dense Grid)</span>
            </div>
          </div>

          {/* Slider 5: BESS Storage Capacity Reserve */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">STORAGE STATE OF CHARGE</span>
              <span className="text-indigo-400 font-bold tabular-nums">
                {params.storageReserve}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={params.storageReserve}
              onChange={(e) => onChangeParams({ storageReserve: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>20% (Depleted)</span>
              <span>80% (Nominal)</span>
              <span>100% (Max Headroom)</span>
            </div>
          </div>

          {/* Summary Indicator Box */}
          <div className="p-3 bg-slate-900 rounded border border-slate-800 flex flex-col justify-between">
            <div className="text-[10px] font-mono text-slate-400 uppercase">
              Simulation State Vector
            </div>
            <div className="text-xs font-mono text-slate-300 space-y-1">
              <div>System Invariant: <span className="text-emerald-400">Converged</span></div>
              <div>Convergence Time: <span className="text-white font-bold">142 ms</span></div>
            </div>
            <button
              onClick={() => onApplyScenario('peak-ev')}
              className="mt-2 w-full py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded text-center transition-colors shadow"
            >
              Test Rapid Convergence
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
