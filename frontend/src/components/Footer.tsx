import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Project Identity */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                SG
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                STIGMERGIC SMART GRID
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Demonstration prototype for decentralized multi-agent energy distribution. Developed for academic evaluation in distributed power systems and biologically-inspired stigmergic coordination.
            </p>
            <div className="text-[11px] font-mono text-slate-500">
              Department of Electrical & Computer Engineering · Swarm Intelligence Lab
            </div>
          </div>

          {/* Col 2: Academic Foundations */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-slate-200 font-bold block">
              Core Methodologies
            </span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Digital Pheromone Fields</li>
              <li>Spatial Diffusion & Decay</li>
              <li>Decentralized Power Dispatch</li>
              <li>Multi-Agent Swarm Balancing</li>
              <li>Kirchhoff Flow Admittance</li>
            </ul>
          </div>

          {/* Col 3: Research References */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-slate-200 font-bold block">
              Literature Citations
            </span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Grassé (1959) · Stigmergy Theory</li>
              <li>Dorigo et al. · Ant Colony Optimization</li>
              <li>IEEE Transactions on Smart Grid (2024)</li>
              <li>FERC Order 2222 Multi-Agent Dispatch</li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright / disclaimer */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © 2026 Smart Grid Multi-Agent Research Project · All Rights Reserved
          </div>
          <div className="flex items-center gap-4">
            <span>Status: Nominal</span>
            <span>Protocol: Stigmergy v2.4</span>
            <span>Evaluation Prototype</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
