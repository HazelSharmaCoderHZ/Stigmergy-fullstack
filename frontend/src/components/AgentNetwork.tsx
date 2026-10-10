import React from 'react';
import { Agent, GridNode } from '../types/grid';
import { ArrowRight } from 'lucide-react';

interface AgentNetworkProps {
  agents: Agent[];
  nodes: GridNode[];
  onSelectNode: (node: GridNode | null) => void;
}

export const AgentNetwork: React.FC<AgentNetworkProps> = ({
  agents,
  nodes,
  onSelectNode,
}) => {
  const getNodeName = (zoneNodeId: string) => {
    const node = nodes.find((n) => n.id === zoneNodeId);
    return node ? `${node.zoneCode} (${node.name})` : zoneNodeId;
  };

  const getStateStyle = (state: Agent['state']) => {
    switch (state) {
      case 'rerouting':
        return { bar: 'bg-slate-300', pill: 'bg-amber-50 text-amber-700 ring-slate-200' };
      case 'discharging':
        return { bar: 'bg-slate-300', pill: 'bg-emerald-50 text-emerald-700 ring-slate-200' };
      case 'signaling':
        return { bar: 'bg-slate-300', pill: 'bg-cyan-50 text-cyan-700 ring-slate-200' };
      case 'balancing':
        return { bar: 'bg-slate-300', pill: 'bg-blue-50 text-blue-700 ring-slate-200' };
      default:
        return { bar: 'bg-slate-300', pill: 'bg-slate-100 text-slate-600 ring-slate-200' };
    }
  };

  return (
    <section id="agents" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Agent Network
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Agents operate independently at substation and feeder nodes. All
              coordination happens through physical grid states, not chat.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <strong className="text-slate-900">{agents.length}</strong> agents online
          </div>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const currentNode = nodes.find((n) => n.id === agent.currentZoneId);
            const style = getStateStyle(agent.state);

            return (
              <div
                key={agent.id}
                onClick={() => currentNode && onSelectNode(currentNode)}
                className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {/* State accent line */}
                <div className={`h-1 w-full ${style.bar}`} />

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-xs">
                        {agent.id}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {agent.name}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500">{agent.role}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${style.pill}`}
                    >
                      {agent.state}
                    </span>
                  </div>

                  {/* Details */}
                  <dl className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">Station</dt>
                      <dd className="text-slate-900 truncate max-w-[180px]">
                        {getNodeName(agent.currentZoneId)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">Signal</dt>
                      <dd className="text-amber-600 font-semibold">
                        {agent.sensedSignal || 'NONE'} · {agent.signalStrength}%
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-slate-400">Adaptation</dt>
                        <dd className="text-emerald-600 font-semibold">{agent.adaptationScore}%</dd>
                      </div>
                      <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, Math.max(0, agent.adaptationScore))}%` }}
                        />
                      </div>
                    </div>
                  </dl>

                  {/* Action */}
                  <p className="text-xs text-slate-700 leading-snug bg-slate-50 border-l-2 border-blue-400 rounded-r-md px-3 py-2">
                    {agent.action}
                  </p>

                  {/* Footer */}
                  <div className="flex justify-end">
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 group-hover:text-blue-600 transition-colors">
                      Inspect
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};