import React from 'react';
import { GridNode, GridLink, Agent, ActiveSignal, PheromoneType } from '../types/grid';
import { GridCanvas } from './GridCanvas';
import { Zap, Radio, Cpu, ArrowDownRight, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

interface HeroSectionProps {
  nodes: GridNode[];
  links: GridLink[];
  agents: Agent[];
  activeSignals: ActiveSignal[];
  selectedNodeId: string | null;
  onSelectNode: (node: GridNode | null) => void;
  showPheromones: boolean;
  showEnergyFlow: boolean;
  showAgents: boolean;
  onTogglePheromones: () => void;
  onToggleEnergyFlow: () => void;
  onToggleAgents: () => void;
  onInjectSignal: (nodeId: string, type: PheromoneType) => void;
  onTriggerSurge: () => void;
  onNavigateToSection: (sectionId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  nodes,
  links,
  agents,
  activeSignals,
  selectedNodeId,
  onSelectNode,
  showPheromones,
  showEnergyFlow,
  showAgents,
  onTogglePheromones,
  onToggleEnergyFlow,
  onToggleAgents,
  onInjectSignal,
  onTriggerSurge,
  onNavigateToSection,
}) => {
  return (
    <section className="relative bg-slate-900 text-white pt-8 pb-12 border-b border-slate-800 overflow-hidden">
      {/* Subtle backdrop glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Left copy + Right living interactive Smart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Academic / Research Context & Value Proposition */}
          <div className="lg:col-span-5 space-y-6">
            
            

            {/* Core Titles */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                STIGMERGIC SMART GRID
              </h1>
              <h2 className="text-lg sm:text-xl font-medium text-blue-300">
                Multi-Agent Coordination Through Intelligent Energy Environments
              </h2>
            </div>

            {/* Scientific Explanation */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              An adaptive electrical grid where autonomous agents sense local physical conditions, deposit environmental signals (<span className="text-blue-300 font-semibold">digital pheromones</span>), and dynamically coordinate real-time power dispatch without a single point of failure or centralized bottlenecks.
            </p>

            

            {/* Interactive Control Triggers for the Professor */}
            <div className="pt-2 space-y-3">
              <div className="text-xs font-mono uppercase text-slate-400">
                Test Environmental Response:
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={onTriggerSurge}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded border border-blue-400/40 shadow flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Trigger Metro Load Surge</span>
                </button>

                <button
                  onClick={() => onInjectSignal('node-01', 'ENERGY_SURPLUS')}
                  className="px-3.5 py-2 text-xs font-medium text-cyan-200 bg-slate-800 hover:bg-slate-700 rounded border border-cyan-800/60 flex items-center gap-2 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Emit Solar Surplus Wave</span>
                </button>

                <button
                  onClick={() => onNavigateToSection('stigmergy')}
                  className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/60 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <span>How Stigmergy Works</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: THE LIVING SMART GRID (Core Hero Visual Anchor) */}
          <div className="lg:col-span-7">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE TOP-DOWN SMART CITY GRID</span>
                </span>
                <span className="text-blue-300">CLICK ANY NODE TO INSPECT TELEMETRY</span>
              </div>

              {/* The Interactive Canvas */}
              <GridCanvas
                nodes={nodes}
                links={links}
                agents={agents}
                activeSignals={activeSignals}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
                showPheromones={showPheromones}
                showEnergyFlow={showEnergyFlow}
                showAgents={showAgents}
                onTogglePheromones={onTogglePheromones}
                onToggleEnergyFlow={onToggleEnergyFlow}
                onToggleAgents={onToggleAgents}
                onInjectSignal={onInjectSignal}
                compactHeroMode={true}
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
