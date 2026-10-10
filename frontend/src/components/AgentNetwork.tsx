import React, { useEffect, useState } from 'react';
import { Agent, GridNode } from '../types/grid';

interface AgentNetworkProps {
  agents: Agent[];
  nodes: GridNode[];
  tickNonce?: number;
  onSelectNode: (node: GridNode | null) => void;
}

export const AgentNetwork: React.FC<AgentNetworkProps> = ({
  agents,
  nodes,
  tickNonce,
  onSelectNode,
}) => {
  const [pulseKey, setPulseKey] = useState(0);
  const [pulsing, setPulsing] = useState(false);

  // Brief, decorative glow whenever a coordination tick completes
  // (signals activity only — not an acceptance verdict from the SafetyGate).
  useEffect(() => {
    if (tickNonce === undefined) return;
    setPulseKey((key) => key + 1);
    setPulsing(true);
    const id = window.setTimeout(() => setPulsing(false), 900);
    return () => window.clearTimeout(id);
  }, [tickNonce]);
  const getNodeName = (zoneNodeId: string) => {
    const node = nodes.find((n) => n.id === zoneNodeId);
    return node ? `${node.zoneCode} (${node.name})` : zoneNodeId;
  };

  return (
    <section id="agents" className="scroll-mt-20 border-b border-slate-200 bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">03 · Agents</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Agent state
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Backend snapshots show each agent's assigned bus, state, and current decision.
            </p>
          </div>

          <div className="text-sm text-slate-600">
            <strong className="text-slate-900">{agents.length}</strong> backend agents
          </div>
        </div>

        {/* Agent Cards Grid */}
        <div key={pulseKey} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${pulsing ? 'agent-tick-pulse' : ''}`}>
          {agents.map((agent) => {
            const currentNode = nodes.find((n) => n.id === agent.currentZoneId);

            return (
              <div
                key={agent.id}
                onClick={() => currentNode && onSelectNode(currentNode)}
                className="group relative overflow-hidden bg-white border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer"
              >
                {/* State accent line */}

                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 border border-blue-100 bg-blue-50 text-blue-800 font-mono font-bold text-xs">
                        {agent.id}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-950 leading-tight">
                          {agent.name}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500">{agent.role}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono uppercase font-semibold text-slate-600">
                      {agent.state}
                    </span>
                  </div>

                  {/* Details */}
                  <dl className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Station</dt>
                      <dd className="text-slate-900 truncate max-w-[180px]">
                        {getNodeName(agent.currentZoneId)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Signal</dt>
                      <dd className="text-slate-800 font-semibold">
                        {agent.sensedSignal || 'NONE'}
                      </dd>
                    </div>
                  </dl>

                  {/* Action */}
                  <p className="text-xs text-slate-700 leading-snug bg-slate-50 border-l-2 border-blue-400 px-3 py-2">
                    {agent.action}
                  </p>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
