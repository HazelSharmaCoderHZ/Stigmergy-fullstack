import React from 'react';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
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
      </div>
    </header>
  );
};
