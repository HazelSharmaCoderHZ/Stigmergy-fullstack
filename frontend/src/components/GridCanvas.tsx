import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GridNode, GridLink, Agent, ActiveSignal } from '../types/grid';
import { Zap, Activity, Shield, Battery, Sun, Wind, Droplets, Factory, Building, Hospital, Radio, ArrowRight, Eye, Layers } from 'lucide-react';

interface GridCanvasProps {
  nodes: GridNode[];
  links: GridLink[];
  agents: Agent[];
  activeSignals?: ActiveSignal[];
  selectedNodeId: string | null;
  onSelectNode: (node: GridNode | null) => void;
  showPheromones: boolean;
  showEnergyFlow: boolean;
  showAgents: boolean;
  onTogglePheromones?: () => void;
  onToggleEnergyFlow?: () => void;
  onToggleAgents?: () => void;
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
  activeSignals = [],
  selectedNodeId,
  onSelectNode,
  showPheromones,
  showEnergyFlow,
  showAgents,
  onTogglePheromones,
  onToggleEnergyFlow,
  onToggleAgents,
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

        // Keep animation density independent of flow; line loading is shown as a measurement.
        const count = 2;
        for (let i = 0; i < count; i++) {
          newParticles.push({
            linkId: link.id,
            sourceX: sCoord.x,
            sourceY: sCoord.y,
            targetX: tCoord.x,
            targetY: tCoord.y,
            progress: ((i * 37 + links.indexOf(link) * 19) % 100) / 100,
            speed: 0.004,
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

      // 1. Mark buses with nonzero agent-sensed trail readings.
      if (showPheromones) {
        nodes.forEach((node) => {
          if (node.pheromoneIntensity > 0) {
            const coord = getCoords(node);
            // The API provides sensed values, not a spatial field extent.
            const radius = 15 + Math.max(0, Math.min(1, node.pheromoneIntensity)) * 3;
            const gradient = ctx.createRadialGradient(
              coord.x,
              coord.y,
              5,
              coord.x,
              coord.y,
              radius
            );

            let r = 59, g = 130, b = 246; // default blue
            if (node.activePheromoneType === 'DEMAND_SIGNAL') {
              r = 239; g = 68; b = 68; // alert red
            } else if (node.activePheromoneType === 'LOAD_PRESSURE') {
              r = 245; g = 158; b = 11; // amber
            } else if (node.activePheromoneType === 'ENERGY_SURPLUS') {
              r = 6; g = 182; b = 212; // cyan
            } else if (node.activePheromoneType === 'AVAILABLE_CAPACITY') {
              r = 16; g = 185; b = 129; // emerald
            }

            const intensity = Math.max(0, Math.min(1, node.pheromoneIntensity));
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.42})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${intensity * 0.18})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(coord.x, coord.y, radius, 0, Math.PI * 2);
            ctx.fill();

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

      });

      // 3. Animate line direction for visual guidance; no MW value is encoded in particle motion.
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
      className="relative w-full bg-white border border-slate-200 overflow-hidden select-none"
      style={{ height: compactHeroMode ? '520px' : '620px' }}
    >
      {/* Background Engineering Coordinate Lattice */}
      <div className="absolute inset-0 tech-grid-pattern pointer-events-none opacity-40" />

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
                className={`relative flex items-center justify-center w-8 h-8 border cursor-pointer transition-colors ${
                  getStatusBorder(node.status)
                } ${isSelected || isHovered ? 'outline outline-2 outline-blue-400' : ''}`}
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
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1 p-1 bg-white border border-slate-200 text-xs">
        <span className="px-2 py-1 text-[11px] font-mono font-semibold text-slate-500 flex items-center gap-1.5 border-r border-slate-200">
          <Layers className="w-3.5 h-3.5 text-blue-700" />
          <span>LAYERS</span>
        </span>

        {onTogglePheromones && (
          <button
            onClick={onTogglePheromones}
            className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
              showPheromones
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            Agent-sensed trail: {showPheromones ? 'ON' : 'OFF'}
          </button>
        )}

        {onToggleEnergyFlow && (
          <button
            onClick={onToggleEnergyFlow}
            className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
              showEnergyFlow
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            Flow direction: {showEnergyFlow ? 'ON' : 'OFF'}
          </button>
        )}

        {onToggleAgents && (
          <button
            onClick={onToggleAgents}
            className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
              showAgents
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            Agents: {showAgents ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      {/* Legend Ribbon */}
      <div className="absolute top-3 right-3 z-30 hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/95 border border-slate-200 text-[10px] font-mono text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-700" />
          <span>In range</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600" />
          <span>Congestion</span>
        </div>
      </div>

      {/* Selected Node Telemetry HUD Drawer (Bottom Left or Floating) */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-84 z-30 border border-slate-200 bg-white p-3.5 text-slate-900">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">
                {selectedNode.zoneCode} · {selectedNode.type.toUpperCase()}
              </span>
              <h4 className="text-sm font-semibold text-slate-950 flex items-center gap-2">
                {selectedNode.name}
              </h4>
            </div>
            <button
              onClick={() => onSelectNode(null)}
              className="text-slate-500 hover:text-slate-950 text-xs px-1.5 py-0.5 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          {/* Load and Energy Bars */}
          <div className="grid grid-cols-2 gap-3 my-2.5">
            {selectedNode.energyLevel !== undefined && <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
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
            </div>}

            {selectedNode.currentLoad !== undefined && <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
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
            </div>}
          </div>

          {/* Power Metrics Table */}
          <div className="space-y-1 text-[11px] font-mono text-slate-700 bg-slate-50 p-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-400">Bus Load:</span>
              <span className="text-slate-950 font-semibold tabular-nums">
                {selectedNode.currentLoadMW?.toFixed(2) ?? '—'} MW
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Generation:</span>
              <span className="text-blue-800 font-semibold tabular-nums">{selectedNode.generationMW?.toFixed(2) ?? '—'} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bus Voltage:</span>
              <span className="text-slate-950 tabular-nums">
                {selectedNode.voltagePU?.toFixed(4) ?? '—'} pu
                {selectedNode.voltageKV !== undefined && ` (${selectedNode.voltageKV.toFixed(2)} kV)`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Agent-sensed trail:</span>
              <span className="text-blue-800 font-semibold">
                {selectedNode.activePheromoneType || 'No sensed trail'} ({selectedNode.pheromoneIntensity.toFixed(4)})
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-2 right-3 z-20 hidden md:flex items-center gap-4 text-[10px] font-mono text-slate-600 bg-white px-2.5 py-1 border border-slate-200">
        <span>BUSES: {nodes.length}</span>
        <span>LINES: {links.length}</span>
        <span>AGENTS: {agents.length}</span>
        <span className="text-blue-400">Backend snapshot</span>
      </div>
    </div>
  );
};
