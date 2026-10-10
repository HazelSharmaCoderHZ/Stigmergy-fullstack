import React from 'react';
import { Activity, Zap, Play, Pause, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  frequencyHz?: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onResetGrid: () => void;
  onTriggerSurge: () => void;
  tickPending?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  frequencyHz,
  isPaused,
  onTogglePause,
  onResetGrid,
  onTriggerSurge,
  tickPending = false,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'live-grid', label: 'Grid' },
    { id: 'agents', label: 'Agents' },
    { id: 'stigmergy', label: 'Stigmergy' },
    { id: 'decisions', label: 'Safety & Decisions' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark / brand */}
        <div className="flex items-center gap-3">
          
          <div>
            <a 
              href="#overview" 
              onClick={(e) => { e.preventDefault(); onSelectTab('overview'); }}
              className="text-base font-semibold tracking-tight text-slate-950 hover:text-blue-800 flex items-center gap-2"
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
                className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-700'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary operational actions and grid telemetry */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pause or resume read-only backend polling */}
          <button
            onClick={onTogglePause}
            title={isPaused ? "Resume backend state polling" : "Pause backend state polling"}
            className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-slate-50"
          >
            {isPaused ? <Play className="w-4 h-4 text-slate-600" /> : <Pause className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Quick Reset */}
          <button
            onClick={onResetGrid}
            title="Refresh backend state"
            className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Deliberate coordination tick request */}
          <button
            onClick={onTriggerSurge}
            disabled={tickPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 border border-blue-700 hover:bg-blue-50 whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-blue-800" />
            <span>{tickPending ? 'Running tick...' : 'Run Coordination Tick'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
