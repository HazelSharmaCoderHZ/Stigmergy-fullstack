import React, { useState, useRef, useEffect } from 'react';
import { TelemetryEvent, PheromoneType } from '../types/grid';
import { Terminal, Filter, ShieldAlert, CheckCircle, AlertCircle, Info, Trash2, Pause, Play } from 'lucide-react';

interface LiveTelemetryLogProps {
  events: TelemetryEvent[];
  onClearEvents: () => void;
  onFilterByAgent?: (agentId: string | null) => void;
}

export const LiveTelemetryLog: React.FC<LiveTelemetryLogProps> = ({
  events,
  onClearEvents,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to top of new events if enabled
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'all') return true;
    if (filterType === 'warnings') return ev.severity === 'warning' || ev.severity === 'alert';
    if (filterType === 'signals') return !!ev.signalType;
    if (filterType === 'actions') return ev.severity === 'success';
    return true;
  });

  const getSeverityBadge = (sev: TelemetryEvent['severity']) => {
    switch (sev) {
      case 'alert':
        return <span className="text-red-400 font-bold">✖ ALERT</span>;
      case 'warning':
        return <span className="text-amber-400 font-bold">▲ WARN</span>;
      case 'success':
        return <span className="text-emerald-400 font-bold">● OK</span>;
      default:
        return <span className="text-blue-800">ℹ INFO</span>;
    }
  };

  return (
    <div className="border-t border-slate-200 pt-4 space-y-3">
      {/* Log Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-800" />
          <h3 className="text-sm font-semibold text-slate-950 font-mono uppercase tracking-wider">
            Coordination Tick Diagnostics
          </h3>

        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200">
            {(['all', 'signals', 'warnings', 'actions'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`px-2 py-0.5 text-[10px] uppercase transition-colors ${
                  filterType === filter
                    ? 'bg-blue-50 text-blue-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded border text-[10px] ${
              autoScroll ? 'bg-slate-900 text-blue-800 border-blue-500/50' : 'bg-white text-slate-600 border-slate-200'
            }`}
            title="Toggle autoscroll to latest"
          >
            {autoScroll ? 'AUTO' : 'MANUAL'}
          </button>

          <button
            onClick={onClearEvents}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={logContainerRef}
        className="h-64 overflow-y-auto space-y-1.5 custom-scrollbar pr-2 font-mono text-[11px] select-text"
      >
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No telemetry records matching filter criteria.
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-2.5 p-1.5 rounded hover:bg-slate-900/80 transition-colors border-b border-slate-900/60 leading-tight"
            >
              {/* Timestamp with milliseconds */}
              <span className="text-slate-500 tabular-nums shrink-0">
                {ev.timestamp}
              </span>

              {/* Severity */}
              <span className="w-16 shrink-0">
                {getSeverityBadge(ev.severity)}
              </span>

              {/* Agent Badge if present */}
              {ev.agentId && (
                <span className="px-1 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] shrink-0 font-semibold">
                  {ev.agentId}
                </span>
              )}

              {/* Zone Badge if present */}
              {ev.zoneId && (
                <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] shrink-0">
                  {ev.zoneId}
                </span>
              )}

              {/* Signal Tag if present */}
              {ev.signalType && (
                <span className="text-amber-400 font-semibold shrink-0">
                  [{ev.signalType}]
                </span>
              )}

              {/* Message */}
              <span className="text-slate-200 break-words flex-1">
                {ev.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer Status */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
        <span>LOG RETENTION: 100 RECORDS</span>
        <span>CHANNEL BUFFER: OK</span>
      </div>
    </div>
  );
};
