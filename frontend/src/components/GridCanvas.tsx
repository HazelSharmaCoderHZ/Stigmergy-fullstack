import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GridNode, GridLink, Agent, ActiveSignal, PheromoneType } from '../types/grid';
import { Zap, Activity, Shield, Battery, Sun, Wind, Droplets, Factory, Building, Hospital, Radio, ArrowRight, Eye, Layers } from 'lucide-react';

interface GridCanvasProps {
  nodes: GridNode[];
  links: GridLink[];
  agents: Agent[];
  activeSignals: ActiveSignal[];
  selectedNodeId: string | null;
  onSelectNode: (node: GridNode | null) => void;
  showPheromones: boolean;
  showEnergyFlow: boolean;
  showAgents: boolean;
  onTogglePheromones?: () => void;
  onToggleEnergyFlow?: () => void;
  onToggleAgents?: () => void;
  onInjectSignal?: (nodeId: string, type: PheromoneType) => void;
  compactHeroMode?: boolean;
}

interface Particle {
  linkId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
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
  compactHeroMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Measure container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || (compactHeroMode ? 520 : 620),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [compactHeroMode]);

  // Create node lookup dictionary
  const nodeMap = useMemo(() => {
    const map = new Map<string, GridNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Selected node object
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Active particle system for energy flow
  const particlesRef = useRef<Particle[]>([]);

  // Initialize and animate canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Helper to get pixel coords from 0-100 percentage
    const getCoords = (node: GridNode) => ({
      x: (node.x / 100) * dimensions.width,
      y: (node.y / 100) * dimensions.height,
    });

    // Populate particles if list is small
    if (particlesRef.current.length < links.length * 4) {
      const newParticles: Particle[] = [];
      links.forEach((link) => {
        const sNode = nodeMap.get(link.source);
        const tNode = nodeMap.get(link.target);
        if (!sNode || !tNode) return;
        const sCoord = getCoords(sNode);
        const tCoord = getCoords(tNode);

        // Density proportional to flow MW
        const count = Math.max(2, Math.floor(link.currentFlowMW / 80));
        for (let i = 0; i < count; i++) {
          newParticles.push({
            linkId: link.id,
            sourceX: sCoord.x,
            sourceY: sCoord.y,
            targetX: tCoord.x,
            targetY: tCoord.y,
            progress: Math.random(),
            speed: 0.003 + (link.currentFlowMW / 1000) * 0.006,
            color: link.status === 'congested' ? '#EF4444' : link.status === 'rerouted' ? '#F59E0B' : '#38BDF8',
            size: link.status === 'congested' ? 3.5 : 2.5,
          });
        }
      });
      particlesRef.current = newParticles;
    }

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // 1. Draw Stigmergic Environmental Signal Field (Pheromones)
      if (showPheromones) {
        // Draw continuous localized grid cell diffusion fields
        nodes.forEach((node) => {
          if (node.pheromoneIntensity > 0.15) {
            const coord = getCoords(node);
            const radius = 35 + node.pheromoneIntensity * 65;
            const gradient = ctx.createRadialGradient(
              coord.x,
              coord.y,
              5,
              coord.x,
              coord.y,
              radius
            );

            let r = 59, g = 130, b = 246; // default blue
            if (node.activePheromoneType === 'DEMAND_SIGNAL' || node.status === 'congestion') {
              r = 239; g = 68; b = 68; // alert red
            } else if (node.activePheromoneType === 'LOAD_PRESSURE' || node.status === 'warning') {
              r = 245; g = 158; b = 11; // amber
            } else if (node.activePheromoneType === 'ENERGY_SURPLUS') {
              r = 6; g = 182; b = 212; // cyan
            } else if (node.activePheromoneType === 'AVAILABLE_CAPACITY') {
              r = 16; g = 185; b = 129; // emerald
            }

            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${node.pheromoneIntensity * 0.42})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${node.pheromoneIntensity * 0.18})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(coord.x, coord.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw subtle diffusion wave contour
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${node.pheromoneIntensity * 0.25})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(coord.x, coord.y, radius * 0.75, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });

        // Draw expanding dynamic signals
        activeSignals.forEach((sig) => {
          const originNode = nodeMap.get(sig.originNodeId);
          if (!originNode) return;
          const coord = getCoords(originNode);
          const pxRadius = (sig.radius / 100) * dimensions.width;

          ctx.strokeStyle = `${sig.color}${Math.floor(sig.intensity * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, pxRadius, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // 2. Draw Physical Transmission Corridors
      links.forEach((link) => {
        const sNode = nodeMap.get(link.source);
        const tNode = nodeMap.get(link.target);
        if (!sNode || !tNode) return;
        const sCoord = getCoords(sNode);
        const tCoord = getCoords(tNode);

        const isHighlighted =
          selectedNodeId && (link.source === selectedNodeId || link.target === selectedNodeId);
        const isDimmed = selectedNodeId && !isHighlighted;

        // Base line
        ctx.beginPath();
        ctx.moveTo(sCoord.x, sCoord.y);
        ctx.lineTo(tCoord.x, tCoord.y);

        if (link.status === 'congested') {
          ctx.strokeStyle = isDimmed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = isHighlighted ? 3.5 : 2.5;
        } else if (link.status === 'rerouted') {
          ctx.strokeStyle = isDimmed ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.85)';
          ctx.lineWidth = isHighlighted ? 3 : 2;
        } else {
          ctx.strokeStyle = isDimmed ? 'rgba(51, 65, 85, 0.3)' : isHighlighted ? 'rgba(59, 130, 246, 0.9)' : 'rgba(51, 65, 85, 0.6)';
          ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
        }
        ctx.stroke();

        // Pheromone trace along line if enabled
        if (showPheromones && link.pheromoneTraces > 0.4 && !isDimmed) {
          ctx.beginPath();
          ctx.moveTo(sCoord.x, sCoord.y);
          ctx.lineTo(tCoord.x, tCoord.y);
          ctx.strokeStyle = `rgba(14, 165, 233, ${link.pheromoneTraces * 0.35})`;
          ctx.lineWidth = 6;
          ctx.stroke();
        }
      });

      // 3. Draw Moving Energy Flow Particles
      if (showEnergyFlow) {
        particlesRef.current.forEach((p) => {
          const link = links.find((l) => l.id === p.linkId);
          if (!link) return;
          const sNode = nodeMap.get(link.source);
          const tNode = nodeMap.get(link.target);
          if (!sNode || !tNode) return;
          const sCoord = getCoords(sNode);
          const tCoord = getCoords(tNode);

          // Update position
          p.progress += p.speed;
          if (p.progress >= 1) {
            p.progress = 0;
          }

          const curX = sCoord.x + (tCoord.x - sCoord.x) * p.progress;
          const curY = sCoord.y + (tCoord.y - sCoord.y) * p.progress;

          const isDimmed = selectedNodeId && link.source !== selectedNodeId && link.target !== selectedNodeId;

          ctx.fillStyle = isDimmed ? 'rgba(56, 189, 248, 0.15)' : p.color;
          ctx.beginPath();
          ctx.arc(curX, curY, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Subtle glow head
          if (!isDimmed) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(curX, curY, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 4. Draw Autonomous Agent Markers & Sensing Radii
      if (showAgents) {
        agents.forEach((agent) => {
          const zoneNode = nodeMap.get(agent.currentZoneId);
          if (!zoneNode) return;
          const coord = getCoords(zoneNode);

          // Agent position is slightly offset from node center to avoid obscuring node icon
          const agentX = coord.x + 14;
          const agentY = coord.y - 14;

          // Agent diamond/hexagon
          ctx.save();
          ctx.translate(agentX, agentY);

          // Pulsing sensing aura
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(37, 99, 235, 0.18)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Diamond core
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(-6, -6, 12, 12);
          ctx.strokeStyle = agent.state === 'rerouting' ? '#F59E0B' : agent.state === 'discharging' ? '#10B981' : '#38BDF8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-6, -6, 12, 12);

          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, links, nodeMap, nodes, selectedNodeId, showAgents, showEnergyFlow, showPheromones, activeSignals, agents]);

  // Node icon resolver
  const getNodeIcon = (type: GridNode['type']) => {
    switch (type) {
      case 'solar': return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'wind': return <Wind className="w-3.5 h-3.5 text-cyan-300" />;
      case 'hydro': return <Droplets className="w-3.5 h-3.5 text-blue-400" />;
      case 'storage': return <Battery className="w-3.5 h-3.5 text-emerald-400" />;
      case 'substation': return <Radio className="w-3.5 h-3.5 text-slate-300" />;
      case 'industrial': return <Factory className="w-3.5 h-3.5 text-rose-400" />;
      case 'commercial': return <Building className="w-3.5 h-3.5 text-yellow-300" />;
      case 'hospital': return <Hospital className="w-3.5 h-3.5 text-red-500" />;
      default: return <Zap className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  // Status color resolver
  const getStatusBorder = (status: GridNode['status']) => {
    switch (status) {
      case 'congestion': return 'border-red-500 ring-2 ring-red-500/40 bg-red-950/70 text-red-400';
      case 'warning': return 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/70 text-amber-400';
      case 'surplus': return 'border-cyan-400 ring-2 ring-cyan-400/30 bg-cyan-950/70 text-cyan-300';
      default: return 'border-blue-500/60 bg-slate-900/90 text-blue-300';
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl select-none"
      style={{ height: compactHeroMode ? '520px' : '620px' }}
    >
      {/* Background Engineering Coordinate Lattice */}
      <div className="absolute inset-0 tech-grid-pattern-dark pointer-events-none opacity-40" />

      {/* HTML5 Canvas for real-time 60fps power flow and stigmergic signals */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onClick={() => onSelectNode(null)}
      />

      {/* SVG / DOM Layer for Nodes and Pins */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const assignedAgent = agents.find((a) => a.currentZoneId === node.id);

          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform duration-150"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                zIndex: isSelected ? 40 : isHovered ? 35 : 20,
              }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
            >
              {/* Interactive Node Marker */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-md border shadow-lg cursor-pointer transition-all duration-200 ${
                  getStatusBorder(node.status)
                } ${isSelected ? 'scale-125 ring-4 ring-blue-400/80' : isHovered ? 'scale-115' : 'scale-100'}`}
              >
                {getNodeIcon(node.type)}

                {/* Subtitle Zone Tag */}
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap text-slate-400 bg-slate-950/80 px-1 rounded border border-slate-800">
                  {node.zoneCode}
                </span>

                {/* Agent Indicator Badge */}
                {assignedAgent && showAgents && (
                  <span className="absolute -top-3 -right-2 px-1 py-0.2 text-[8px] font-mono font-bold bg-blue-600 text-white rounded border border-blue-300 shadow">
                    {assignedAgent.id}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Overlay: Layer Visibility Toggles */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded border border-slate-800 text-xs">
        <span className="px-2 py-1 text-[11px] font-mono font-semibold text-slate-400 flex items-center gap-1.5 border-r border-slate-800">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>LAYERS</span>
        </span>

        {onTogglePheromones && (
          <button
            onClick={onTogglePheromones}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
              showPheromones
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Pheromones: {showPheromones ? 'ON' : 'OFF'}
          </button>
        )}

        {onToggleEnergyFlow && (
          <button
            onClick={onToggleEnergyFlow}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
              showEnergyFlow
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Flow Pulses: {showEnergyFlow ? 'ON' : 'OFF'}
          </button>
        )}

        {onToggleAgents && (
          <button
            onClick={onToggleAgents}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
              showAgents
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Agents: {showAgents ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      {/* Legend Ribbon */}
      <div className="absolute top-3 right-3 z-30 hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded border border-slate-800 text-[10px] font-mono text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Surplus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Stable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Congestion</span>
        </div>
      </div>

      {/* Selected Node Telemetry HUD Drawer (Bottom Left or Floating) */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-84 z-30 p-3.5 bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-700 shadow-2xl text-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                {selectedNode.zoneCode} · {selectedNode.type.toUpperCase()}
              </span>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {selectedNode.name}
              </h4>
            </div>
            <button
              onClick={() => onSelectNode(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Load and Energy Bars */}
          <div className="grid grid-cols-2 gap-3 my-2.5">
            <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>ENERGY AVAIL</span>
                <span className="text-blue-300 font-bold">{selectedNode.energyLevel}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${selectedNode.energyLevel}%` }}
                />
              </div>
            </div>

            <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>LOAD DEMAND</span>
                <span className={`font-bold ${selectedNode.currentLoad > 85 ? 'text-red-400' : 'text-slate-200'}`}>
                  {selectedNode.currentLoad}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    selectedNode.currentLoad > 85 ? 'bg-red-500' : selectedNode.currentLoad > 70 ? 'bg-amber-500' : 'bg-blue-400'
                  }`}
                  style={{ width: `${selectedNode.currentLoad}%` }}
                />
              </div>
            </div>
          </div>

          {/* Power Metrics Table */}
          <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/60">
            <div className="flex justify-between">
              <span className="text-slate-400">Capacity / Load:</span>
              <span className="text-slate-100 font-semibold tabular-nums">
                {selectedNode.currentLoadMW} / {selectedNode.capacityMW} MW
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Generation:</span>
              <span className="text-cyan-400 font-semibold tabular-nums">{selectedNode.generationMW} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bus Voltage:</span>
              <span className="text-slate-100 tabular-nums">{selectedNode.voltageKV} kV</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pheromone Signal:</span>
              <span className="text-amber-400 font-semibold">
                {selectedNode.activePheromoneType || 'NOMINAL'} ({(selectedNode.pheromoneIntensity * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Quick Action: Inject Environmental Signal */}
          {onInjectSignal && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5">
              <button
                onClick={() => onInjectSignal(selectedNode.id, 'DEMAND_SIGNAL')}
                className="flex-1 px-2 py-1 text-[10px] font-mono font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 transition-colors"
              >
                + Demand Signal
              </button>
              <button
                onClick={() => onInjectSignal(selectedNode.id, 'ENERGY_SURPLUS')}
                className="flex-1 px-2 py-1 text-[10px] font-mono font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 transition-colors"
              >
                + Surplus Wave
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-2 right-3 z-20 hidden md:flex items-center gap-4 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
        <span>NODES: {nodes.length}</span>
        <span>CORRIDORS: {links.length}</span>
        <span>SWARM AGENTS: {agents.length}</span>
        <span className="text-blue-400">ENGINE: ACTIVE 60FPS</span>
      </div>
    </div>
  );
};
