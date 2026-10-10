import React, { useState } from 'react';
import { GridNode, GridLink, Agent } from '../types/grid';
import { GridCanvas } from './GridCanvas';
import { Zap } from 'lucide-react';

interface SmartGridMapSectionProps {
  nodes: GridNode[];
  links: GridLink[];
  agents: Agent[];
  selectedNode: GridNode | null;
  onSelectNode: (node: GridNode | null) => void;
  showPheromones: boolean;
  showEnergyFlow: boolean;
  showAgents: boolean;
  onTogglePheromones: () => void;
  onToggleEnergyFlow: () => void;
  onToggleAgents: () => void;
  onTriggerSurge: () => void;
  tickPending?: boolean;
  tickNonce?: number;
}

export const SmartGridMapSection: React.FC<SmartGridMapSectionProps> = ({
  nodes,
  links,
  agents,
  selectedNode,
  onSelectNode,
  showPheromones,
  showEnergyFlow,
  showAgents,
  onTogglePheromones,
  onToggleEnergyFlow,
  onToggleAgents,
  onTriggerSurge,
  tickPending = false,
  tickNonce,
}) => {
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>('all');

  const filteredNodes = nodes.filter((node) => {
    if (zoneTypeFilter === 'all') return true;
    if (zoneTypeFilter === 'generators') return (node.generationMW ?? 0) > 0;
    if (zoneTypeFilter === 'high-voltage') return node.voltagePU !== undefined && node.voltagePU > 1.05;
    if (zoneTypeFilter === 'normal-voltage') return node.voltagePU !== undefined && node.voltagePU >= 0.95 && node.voltagePU <= 1.05;
    if (zoneTypeFilter === 'loads') return (node.currentLoadMW ?? 0) > 0;
    return true;
  });

  return (
    <section id="live-grid" className="scroll-mt-20 border-b border-slate-200 bg-white py-10 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">02 · Grid</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              IEEE-14 bus model
            </h2>
            <p className="text-sm text-slate-600">
              Schematic IEEE-14 bus layout. Select a bus to inspect measured voltage, load, generation, and agent-sensed trail values.
            </p>
          </div>

          {/* Quick Zone Category Filters */}
          <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white p-1 text-xs font-mono">
            {[
              { id: 'all', label: 'All 14 Buses' },
              { id: 'generators', label: 'Generation' },
              { id: 'high-voltage', label: 'High Voltage' },
              { id: 'normal-voltage', label: 'Normal Voltage' },
              { id: 'loads', label: 'Load Buses' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setZoneTypeFilter(f.id)}
                className={`px-2.5 py-1 text-[11px] transition-colors ${
                  zoneTypeFilter === f.id
                    ? 'bg-blue-50 text-blue-800 font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid visualization and measured bus details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Main Visualizer Stage */}
          <div className="lg:col-span-8 space-y-3">
            <GridCanvas
              nodes={filteredNodes}
              links={links}
              agents={agents}
              selectedNodeId={selectedNode ? selectedNode.id : null}
              onSelectNode={onSelectNode}
              showPheromones={showPheromones}
              showEnergyFlow={showEnergyFlow}
              showAgents={showAgents}
              onTogglePheromones={onTogglePheromones}
              onToggleEnergyFlow={onToggleEnergyFlow}
              onToggleAgents={onToggleAgents}
              compactHeroMode={false}
              tickNonce={tickNonce}
            />

            {/* Quick Actions Panel below Canvas */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-white p-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase">Coordination:</span>
                <button
                  onClick={onTriggerSurge}
                  disabled={tickPending}
                  className="flex items-center gap-1.5 border border-blue-700 px-2.5 py-1 text-blue-800 transition-colors hover:bg-blue-50 disabled:opacity-50"
                >
                  <Zap className="h-3 w-3" />
                  <span>{tickPending ? 'Tick running...'  : 'Run coordination tick'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <span>SELECTED BUS:</span>
                <span className="text-blue-800 font-semibold">
                  {selectedNode ? `${selectedNode.zoneCode} - ${selectedNode.name}` : 'NONE (Select a bus)'}
                </span>
              </div>
            </div>
          </div>

          {/* Selected bus details */}
          <div className="lg:col-span-4">
            {/* Quick Grid Zone Directory Snapshot */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 uppercase">Bus directory</span>
                <span className="text-blue-800">{nodes.length} buses</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {nodes.map((n) => {
                  const isCurrent = selectedNode?.id === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => onSelectNode(n)}
                      className={`flex items-center justify-between p-2 text-xs font-mono cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 text-blue-900 border border-blue-300'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-slate-600">{n.zoneCode}</span>
                        <span className="truncate">{n.name}</span>
                      </div>
              <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-500">
                          {n.voltagePU?.toFixed(3) ?? '—'}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
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
