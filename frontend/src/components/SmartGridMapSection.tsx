import React, { useState } from 'react';
import { GridNode, GridLink, Agent, ActiveSignal, PheromoneType } from '../types/grid';
import { GridCanvas } from './GridCanvas';
import { LiveTelemetryLog } from './LiveTelemetryLog';
import { TelemetryEvent } from '../types/grid';
import { 
  Compass, 
  Layers, 
  Zap, 
  Radio, 
  Cpu, 
  Sliders, 
  Activity, 
  ShieldCheck, 
  MapPin, 
  PlusCircle, 
  RefreshCw 
} from 'lucide-react';

interface SmartGridMapSectionProps {
  nodes: GridNode[];
  links: GridLink[];
  agents: Agent[];
  activeSignals: ActiveSignal[];
  selectedNode: GridNode | null;
  onSelectNode: (node: GridNode | null) => void;
  showPheromones: boolean;
  showEnergyFlow: boolean;
  showAgents: boolean;
  onTogglePheromones: () => void;
  onToggleEnergyFlow: () => void;
  onToggleAgents: () => void;
  onInjectSignal: (nodeId: string, type: PheromoneType) => void;
  telemetryEvents: TelemetryEvent[];
  onClearEvents: () => void;
  onTriggerSurge: () => void;
}

export const SmartGridMapSection: React.FC<SmartGridMapSectionProps> = ({
  nodes,
  links,
  agents,
  activeSignals,
  selectedNode,
  onSelectNode,
  showPheromones,
  showEnergyFlow,
  showAgents,
  onTogglePheromones,
  onToggleEnergyFlow,
  onToggleAgents,
  onInjectSignal,
  telemetryEvents,
  onClearEvents,
  onTriggerSurge,
}) => {
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>('all');

  const filteredNodes = nodes.filter((node) => {
    if (zoneTypeFilter === 'all') return true;
    if (zoneTypeFilter === 'generators') return node.type === 'solar' || node.type === 'wind' || node.type === 'hydro';
    if (zoneTypeFilter === 'storage') return node.type === 'storage';
    if (zoneTypeFilter === 'substations') return node.type === 'substation';
    if (zoneTypeFilter === 'loads') return node.type === 'industrial' || node.type === 'commercial' || node.type === 'residential' || node.type === 'hospital';
    return true;
  });

  return (
    <section id="live-grid" className="py-16 bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Interactive Smart Grid Operations Map
            </h2>
            <p className="text-sm text-slate-300">
              Select any busbar to inspect real-time voltage, thermal loading, and surrounding stigmergic signal gradients.
            </p>
          </div>

          {/* Quick Zone Category Filters */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs font-mono">
            {[
              { id: 'all', label: 'All 16 Zones' },
              { id: 'generators', label: 'Generators' },
              { id: 'storage', label: 'BESS' },
              { id: 'substations', label: 'Substations' },
              { id: 'loads', label: 'Load Hubs' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setZoneTypeFilter(f.id)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  zoneTypeFilter === f.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* The Main Living Grid Map + Side Telemetry Log Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Visualizer Stage */}
          <div className="lg:col-span-8 space-y-3">
            <GridCanvas
              nodes={filteredNodes}
              links={links}
              agents={agents}
              activeSignals={activeSignals}
              selectedNodeId={selectedNode ? selectedNode.id : null}
              onSelectNode={onSelectNode}
              showPheromones={showPheromones}
              showEnergyFlow={showEnergyFlow}
              showAgents={showAgents}
              onTogglePheromones={onTogglePheromones}
              onToggleEnergyFlow={onToggleEnergyFlow}
              onToggleAgents={onToggleAgents}
              onInjectSignal={onInjectSignal}
              compactHeroMode={false}
            />

            {/* Quick Actions Panel below Canvas */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 uppercase">Interactive Injections:</span>
                <button
                  onClick={onTriggerSurge}
                  className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-rose-400" />
                  <span>Surge Zone-07</span>
                </button>
                <button
                  onClick={() => onInjectSignal('node-01', 'ENERGY_SURPLUS')}
                  className="px-2.5 py-1 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 transition-colors flex items-center gap-1.5"
                >
                  <Radio className="w-3 h-3 text-cyan-400" />
                  <span>Solar Peak Zone-01</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span>SELECTION:</span>
                <span className="text-blue-300 font-bold">
                  {selectedNode ? `${selectedNode.zoneCode} - ${selectedNode.name}` : 'NONE (Click node to lock)'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Event Terminal Log & Selected Details */}
          <div className="lg:col-span-4 space-y-4">
            <LiveTelemetryLog
              events={telemetryEvents}
              onClearEvents={onClearEvents}
            />

            {/* Quick Grid Zone Directory Snapshot */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 uppercase">ZONE DIRECTORY</span>
                <span className="text-blue-400">{nodes.length} ZONES MONITORED</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {nodes.map((n) => {
                  const isCurrent = selectedNode?.id === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => onSelectNode(n)}
                      className={`flex items-center justify-between p-2 rounded text-xs font-mono cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/30 text-white border border-blue-500'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-slate-400">{n.zoneCode}</span>
                        <span className="truncate">{n.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={n.currentLoad > 85 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                          {n.currentLoad}% Load
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
