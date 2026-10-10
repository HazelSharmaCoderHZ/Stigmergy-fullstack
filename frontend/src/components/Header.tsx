import React from 'react';
import { Activity, Zap, Play, Pause, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  frequencyHz: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onResetGrid: () => void;
  onTriggerSurge: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  frequencyHz,
  isPaused,
  onTogglePause,
  onResetGrid,
  onTriggerSurge,
}) => {
  const navItems = [
    { id: 'live-grid', label: 'Live Grid Map' },
    { id: 'stigmergy', label: 'Stigmergic Activity' },
    { id: 'analytics', label: 'Energy Analytics' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark / brand */}
        <div className="flex items-center gap-3">
          
          <div>
            <a 
              href="#overview" 
              onClick={(e) => { e.preventDefault(); onSelectTab('overview'); }}
              className="text-base font-bold tracking-tight text-white hover:text-blue-300 transition-colors flex items-center gap-2"
            >
              STIGMERGIC SMART GRID
            </a>
            
          </div>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary operational actions and grid telemetry */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Frequency Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">FREQ</span>
            <span className="text-slate-200 tabular-nums font-semibold">
              {frequencyHz.toFixed(3)} Hz
            </span>
          </div>

          {/* Quick Simulation Pause / Run */}
          <button
            onClick={onTogglePause}
            title={isPaused ? "Resume real-time simulation" : "Pause simulation"}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Quick Reset */}
          <button
            onClick={onResetGrid}
            title="Reset grid state to nominal"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Inject Surge CTA */}
          <button
            onClick={onTriggerSurge}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded border border-blue-400/40 shadow-sm transition-colors whitespace-nowrap active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Inject Surge</span>
          </button>
        </div>

      </div>
    </header>
  );
};
