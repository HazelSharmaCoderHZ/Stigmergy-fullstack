import {
  getGridState,
  type BackendGridState,
} from './services/api';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  GridNode, 
  GridLink, 
  Agent, 
  ActiveSignal, 
  TelemetryEvent, 
  SimulationParams, 
  SystemMetrics, 
  PheromoneType 
} from './types/grid';
import { 
  INITIAL_NODES, 
  INITIAL_LINKS, 
  INITIAL_AGENTS, 
  INITIAL_TELEMETRY, 
  INITIAL_METRICS 
} from './data/gridData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { SmartGridMapSection } from './components/SmartGridMapSection';
import { StigmergyVisualizer } from './components/StigmergyVisualizer';
import { ControlDashboard } from './components/ControlDashboard';
import { Footer } from './components/Footer';

export default function App() {
  // Master state
  const [nodes, setNodes] = useState<GridNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<GridLink[]>(INITIAL_LINKS);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activeSignals, setActiveSignals] = useState<ActiveSignal[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>(INITIAL_TELEMETRY);
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL_METRICS);
  const [backendGrid, setBackendGrid] =
  useState<BackendGridState | null>(null);

const [backendStatus, setBackendStatus] =
  useState<'connecting' | 'connected' | 'error'>('connecting');

const [backendError, setBackendError] = useState('');
const [lastBackendUpdate, setLastBackendUpdate] =
  useState<Date | null>(null);
  // Layer visibility toggles
  const [showPheromones, setShowPheromones] = useState<boolean>(true);
  const [showEnergyFlow, setShowEnergyFlow] = useState<boolean>(true);
  const [showAgents, setShowAgents] = useState<boolean>(true);

  // Selected node inspection
  const [selectedNode, setSelectedNode] = useState<GridNode | null>(null);

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<string>('overview');

useEffect(() => {
  let active = true;
  let inFlight = false;

  const refreshBackend = async () => {
    if (inFlight) return;
    inFlight = true;

    try {
      const data = await getGridState();

      if (!active) return;

      setBackendGrid(data);
      setBackendStatus('connected');
      setBackendError('');
      setLastBackendUpdate(new Date());
    } catch (error) {
      if (!active) return;

      setBackendStatus('error');
      setBackendError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to backend',
      );
    } finally {
      inFlight = false;
    }
  };

  void refreshBackend();

  const interval = window.setInterval(
    () => void refreshBackend(),
    3000,
  );

  return () => {
    active = false;
    window.clearInterval(interval);
  };
}, []);

  // Convert the backend's zero-based IEEE-14 buses to the UI's existing node IDs.
  // Coordinates, labels, and node categories stay unchanged to preserve the design.
  const displayNodes = useMemo<GridNode[]>(() => {
    if (!backendGrid) return nodes;

    return nodes.map((node) => {
      const busId = Number(node.id.replace('node-', '')) - 1;
      const bus = backendGrid.buses.find((item) => item.id === busId);
      if (!bus) return node;

      const loadPercent = node.capacityMW > 0
        ? Math.min(100, Math.max(0, (bus.load_mw / node.capacityMW) * 100))
        : 0;
      const voltageOutOfRange = bus.voltage_pu < 0.95 || bus.voltage_pu > 1.05;

      return {
        ...node,
        // Electrical measurements come from pandapower, not the mock simulation.
        voltageKV: bus.nominal_voltage_kv * bus.voltage_pu,
        generationMW: bus.generation_mw,
        currentLoadMW: bus.load_mw,
        currentLoad: Math.round(loadPercent),
        status: voltageOutOfRange ? 'warning' : 'stable',
      };
    });
  }, [backendGrid, nodes]);

  const displayLinks = useMemo<GridLink[]>(() => {
    if (!backendGrid) return links;

    return backendGrid.lines.map((line) => {
      const source = `node-${String(line.from_bus + 1).padStart(2, '0')}`;
      const target = `node-${String(line.to_bus + 1).padStart(2, '0')}`;
      const previous = links.find(
        (item) => item.source === source && item.target === target
          || item.source === target && item.target === source,
      );
      const flowMW = Math.abs(line.p_from_mw);
      // IEEE benchmark line loading is the authoritative status measurement.
      const status: GridLink['status'] =
        line.loading_percent >= 80 ? 'congested' : 'normal';

      return {
        id: `backend-line-${line.id}`,
        source,
        target,
        capacityMW: previous?.capacityMW
          ?? (line.loading_percent > 0
            ? flowMW / (line.loading_percent / 100)
            : Math.max(flowMW, 1)),
        currentFlowMW: flowMW,
        status,
        // Trail visualization remains local/mock until backend trail values are exposed.
        pheromoneTraces: previous?.pheromoneTraces ?? 0,
      };
    });
  }, [backendGrid, links]);

  const displayMetrics = useMemo<SystemMetrics>(() => ({
    ...metrics,
    totalGenerationMW: backendGrid?.total_generation_mw ?? metrics.totalGenerationMW,
    totalDemandMW: backendGrid?.total_load_mw ?? metrics.totalDemandMW,
  }), [backendGrid, metrics]);

  // Simulation Parameters
  const [simParams, setSimParams] = useState<SimulationParams>({
    speed: 1,
    isPaused: false,
    demandFactor: 1.0,
    renewableSupply: 1.0,
    agentDensity: 6,
    decayRate: 0.08,
    storageReserve: 80,
  });

  // Helper to add telemetry event
  const addTelemetry = useCallback((
    message: string, 
    severity: TelemetryEvent['severity'] = 'info', 
    agentId?: string, 
    zoneId?: string, 
    signalType?: PheromoneType
  ) => {
    const now = new Date();
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    const timestamp = `${now.toTimeString().split(' ')[0]}.${ms}`;
    
    const newEvent: TelemetryEvent = {
      id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      message,
      severity,
      agentId,
      zoneId,
      signalType,
    };

    setTelemetryEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
  }, []);

  // Action: Trigger Demand Surge at Zone 07 (or 08)
  const handleTriggerSurge = useCallback(() => {
    // 1. Spikes demand in Zone 07
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.id === 'node-07') {
          return {
            ...n,
            currentLoad: 96,
            currentLoadMW: 624,
            status: 'congestion',
            pheromoneIntensity: 0.98,
            activePheromoneType: 'DEMAND_SIGNAL',
          };
        }
        if (n.id === 'node-08') {
          return {
            ...n,
            currentLoad: 94,
            currentLoadMW: 658,
            status: 'warning',
            pheromoneIntensity: 0.85,
            activePheromoneType: 'LOAD_PRESSURE',
          };
        }
        return n;
      })
    );

    // 2. Add an expanding dynamic signal wave
    const surgeSignal: ActiveSignal = {
      id: `sig-${Date.now()}`,
      type: 'DEMAND_SIGNAL',
      originNodeId: 'node-07',
      radius: 5,
      maxRadius: 35,
      intensity: 0.95,
      decayRate: simParams.decayRate,
      color: '#EF4444',
      createdTime: Date.now(),
    };
    setActiveSignals((prev) => [...prev, surgeSignal]);

    // 3. Mark feeder corridor as congested
    setLinks((prevLinks) =>
      prevLinks.map((l) => {
        if (l.id === 'link-04-07') {
          return { ...l, currentFlowMW: 490, status: 'congested', pheromoneTraces: 0.95 };
        }
        return l;
      })
    );

    // 4. Update Agents to respond to the surge
    setAgents((prevAgents) =>
      prevAgents.map((ag) => {
        if (ag.id === 'AG-04') {
          return {
            ...ag,
            state: 'balancing',
            action: 'Deposited urgent demand pheromone at Zone 07; propagating impedance penalty',
            sensedSignal: 'DEMAND_SIGNAL',
            signalStrength: 98,
          };
        }
        if (ag.id === 'AG-02') {
          return {
            ...ag,
            state: 'rerouting',
            action: 'Sensed demand pheromone gradient from Zone 07; opening redundant feeder corridor 05-06',
            sensedSignal: 'DEMAND_SIGNAL',
            signalStrength: 94,
          };
        }
        if (ag.id === 'AG-03') {
          return {
            ...ag,
            state: 'discharging',
            action: 'BESS Mega-Storage ramped to 280 MW discharge to mitigate Metro feeder drop',
            sensedSignal: 'LOAD_PRESSURE',
            signalStrength: 91,
          };
        }
        return ag;
      })
    );

    // 5. Add Telemetry logs
    addTelemetry(
      'UNEXPECTED LOAD SURGE: Zone-07 Industrial complex surged to 624 MW (96% capacity).',
      'alert',
      'AG-04',
      'ZONE-07',
      'DEMAND_SIGNAL'
    );
    addTelemetry(
      'Environmental signal [DEMAND_SIGNAL] deposited on grid cell. Spatial gradient diffusing to Zone-04 and Zone-08.',
      'warning',
      'AG-04',
      'ZONE-07',
      'DEMAND_SIGNAL'
    );

    // Schedule self-healing equilibrium after 3 seconds
    setTimeout(() => {
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id === 'node-07') {
            return {
              ...n,
              currentLoad: 76,
              currentLoadMW: 494,
              status: 'stable',
              pheromoneIntensity: 0.45,
            };
          }
          if (n.id === 'node-08') {
            return {
              ...n,
              currentLoad: 78,
              currentLoadMW: 546,
              status: 'stable',
              pheromoneIntensity: 0.38,
            };
          }
          return n;
        })
      );

      setLinks((prevLinks) =>
        prevLinks.map((l) => {
          if (l.id === 'link-04-07') {
            return { ...l, currentFlowMW: 380, status: 'normal', pheromoneTraces: 0.4 };
          }
          return l;
        })
      );

      addTelemetry(
        'STIGMERGIC EQUILIBRIUM: AG-02 & AG-03 dispersed surge power across dual corridors. Zone-07 thermal load reduced to 76%.',
        'success',
        'AG-02',
        'ZONE-07',
        'DEMAND_SIGNAL'
      );
    }, 4500);
  }, [addTelemetry, simParams.decayRate]);

  // Action: Inject specific signal on any node
  const handleInjectSignal = useCallback((nodeId: string, type: PheromoneType) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    let color = '#38BDF8';
    if (type === 'DEMAND_SIGNAL') color = '#EF4444';
    if (type === 'LOAD_PRESSURE') color = '#F59E0B';
    if (type === 'ENERGY_SURPLUS') color = '#06B6D4';
    if (type === 'AVAILABLE_CAPACITY') color = '#10B981';

    const newSig: ActiveSignal = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      type,
      originNodeId: nodeId,
      radius: 4,
      maxRadius: 32,
      intensity: 0.9,
      decayRate: simParams.decayRate,
      color,
      createdTime: Date.now(),
    };

    setActiveSignals((prev) => [...prev, newSig]);

    // Intensify node pheromone value
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              pheromoneIntensity: Math.min(1.0, n.pheromoneIntensity + 0.4),
              activePheromoneType: type,
            }
          : n
      )
    );

    addTelemetry(
      `Environmental signal [${type}] injected at ${targetNode.zoneCode} (${targetNode.name}). Gradient radiating to neighbor buses.`,
      type === 'DEMAND_SIGNAL' ? 'warning' : 'info',
      undefined,
      targetNode.zoneCode,
      type
    );
  }, [nodes, simParams.decayRate, addTelemetry]);

  // Action: Apply predefined scenario
  const handleApplyScenario = useCallback((scenarioName: string) => {
    if (scenarioName === 'peak-ev') {
      handleTriggerSurge();
      addTelemetry('SCENARIO APPLIED: Peak Evening EV Surge across metropolitan depots.', 'warning');
    } else if (scenarioName === 'solar-drop') {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === 'node-01'
            ? { ...n, generationMW: 140, currentLoad: 68, status: 'warning', energyLevel: 35 }
            : n
        )
      );
      handleInjectSignal('node-01', 'DEMAND_SIGNAL');
      addTelemetry('SCENARIO APPLIED: Rapid solar intermittency drop (-65% irradiance).', 'warning', 'AG-05', 'ZONE-01');
    } else if (scenarioName === 'line-trip') {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === 'link-05-08'
            ? { ...l, currentFlowMW: 0, status: 'congested', pheromoneTraces: 1.0 }
            : l
        )
      );
      handleInjectSignal('node-05', 'CONGESTION_GRADIENT');
      addTelemetry('SCENARIO APPLIED: Transmission Corridor 05-08 tripped. Congestion repulsion diverted power.', 'alert', 'AG-04');
    } else if (scenarioName === 'steady-state') {
      setNodes(INITIAL_NODES);
      setLinks(INITIAL_LINKS);
      setAgents(INITIAL_AGENTS);
      setActiveSignals([]);
      addTelemetry('SCENARIO APPLIED: Nominal Grid Equilibrium restored across all 16 zones.', 'success');
    }
  }, [handleTriggerSurge, handleInjectSignal, addTelemetry]);

  // Reset grid state to nominal
  const handleResetGrid = useCallback(() => {
    setNodes(INITIAL_NODES);
    setLinks(INITIAL_LINKS);
    setAgents(INITIAL_AGENTS);
    setActiveSignals([]);
    setMetrics(INITIAL_METRICS);
    setSelectedNode(null);
    addTelemetry('SYSTEM RESET: Grid topology and agent swarm restored to factory nominal.', 'info');
  }, [addTelemetry]);

  // Real-time Simulation Engine Tick (every 1s)
  useEffect(() => {
    if (simParams.isPaused) return;

    const intervalTime = 1200 / simParams.speed;

    const interval = setInterval(() => {
      // 1. Decays active dynamic signals
      setActiveSignals((prevSignals) =>
        prevSignals
          .map((sig) => ({
            ...sig,
            radius: sig.radius + 1.2 * simParams.speed,
            intensity: sig.intensity - sig.decayRate * simParams.speed,
          }))
          .filter((sig) => sig.intensity > 0.05 && sig.radius < sig.maxRadius)
      );

      // 2. Modulate node state values with natural fluctuations & parameters
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          // Slight natural thermal load jitter
          const jitter = (Math.random() - 0.5) * 2;
          const adjustedLoad = Math.min(
            100,
            Math.max(10, Math.round(node.currentLoad * simParams.demandFactor + jitter))
          );

          // Pheromone natural decay
          const newPhero = Math.max(0.08, node.pheromoneIntensity - simParams.decayRate * 0.1);

          return {
            ...node,
            currentLoad: adjustedLoad,
            pheromoneIntensity: newPhero,
          };
        })
      );

      // 3. Modulate aggregate frequency and metrics
      setMetrics((prev) => {
        const delta = (Math.random() - 0.5) * 0.008;
        return {
          ...prev,
          frequencyHz: Math.max(49.97, Math.min(50.03, 50.015 + delta)),
          gridEfficiency: parseFloat((98.2 + (Math.random() - 0.5) * 0.4).toFixed(1)),
          totalDemandMW: Math.round(1410 * simParams.demandFactor),
          totalGenerationMW: Math.round(1570 * simParams.renewableSupply),
        };
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [simParams]);

  // Navigation scroll handler
  const handleNavigateToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Live backend connection and IEEE-14 power-flow telemetry */}
      <section className="border-b border-slate-700 bg-slate-950 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-emerald-400'
                  : backendStatus === 'error'
                    ? 'bg-red-400'
                    : 'bg-amber-400'
              }`}
            />
            <span className="text-sm font-semibold">
              Backend: {backendStatus.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">
              IEEE-14 power-flow model
            </span>
          </div>

          {backendGrid && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
              <span> Buses: <strong>{backendGrid.bus_count}</strong> </span>
              <span> Lines: <strong>{backendGrid.line_count}</strong> </span>
              <span>
                Generation: <strong>{backendGrid.total_generation_mw.toFixed(2)} MW</strong>
              </span>
              <span>
                Load: <strong>{backendGrid.total_load_mw.toFixed(2)} MW</strong>
              </span>
              <span>
                Voltage range: <strong>{backendGrid.min_voltage_pu.toFixed(3)}–{backendGrid.max_voltage_pu.toFixed(3)} pu</strong>
              </span>
              <span>
                Power flow: <strong>{backendGrid.converged ? 'CONVERGED' : 'NOT CONVERGED'}</strong>
              </span>
            </div>
          )}

          {backendStatus === 'error' && (
            <p className="w-full text-xs text-red-300">{backendError}</p>
          )}

          {lastBackendUpdate && (
            <p className="w-full text-xs text-slate-500">
              Last successful update: {lastBackendUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </section>

      {/* Strict 3-zone Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleNavigateToSection}
        frequencyHz={displayMetrics.frequencyHz}
        isPaused={simParams.isPaused}
        onTogglePause={() => setSimParams((p) => ({ ...p, isPaused: !p.isPaused }))}
        onResetGrid={handleResetGrid}
        onTriggerSurge={handleTriggerSurge}
      />

      <main className="flex-1">
        {/* 1. Hero Section: "STIGMERGIC SMART GRID" with living interactive Grid Canvas */}
        <HeroSection
          nodes={displayNodes}
          links={displayLinks}
          agents={agents}
          activeSignals={activeSignals}
          selectedNodeId={selectedNode ? selectedNode.id : null}
          onSelectNode={setSelectedNode}
          showPheromones={showPheromones}
          showEnergyFlow={showEnergyFlow}
          showAgents={showAgents}
          onTogglePheromones={() => setShowPheromones(!showPheromones)}
          onToggleEnergyFlow={() => setShowEnergyFlow(!showEnergyFlow)}
          onToggleAgents={() => setShowAgents(!showAgents)}
          onInjectSignal={handleInjectSignal}
          onTriggerSurge={handleTriggerSurge}
          onNavigateToSection={handleNavigateToSection}
        />

        {/* 2. Live Interactive Smart Grid Map Stage with Telemetry Terminal */}
        <SmartGridMapSection
          nodes={displayNodes}
          links={displayLinks}
          agents={agents}
          activeSignals={activeSignals}
          selectedNode={selectedNode ? (displayNodes.find((node) => node.id === selectedNode.id) ?? selectedNode) : null}
          onSelectNode={setSelectedNode}
          showPheromones={showPheromones}
          showEnergyFlow={showEnergyFlow}
          showAgents={showAgents}
          onTogglePheromones={() => setShowPheromones(!showPheromones)}
          onToggleEnergyFlow={() => setShowEnergyFlow(!showEnergyFlow)}
          onToggleAgents={() => setShowAgents(!showAgents)}
          onInjectSignal={handleInjectSignal}
          telemetryEvents={telemetryEvents}
          onClearEvents={() => setTelemetryEvents([])}
          onTriggerSurge={handleTriggerSurge}
        />

        {/* 3. Stigmergic Environmental Coordination Engine (6-Step Lifecycle) */}
        <StigmergyVisualizer
          onTriggerSurge={handleTriggerSurge}
          onInjectSignal={handleInjectSignal}
        />

        {/* 4. Control Room Operations Dashboard & Precision Graphs */}
        <ControlDashboard
          metrics={displayMetrics}
          nodes={displayNodes}
          onSelectNode={(node) => {
            setSelectedNode(node);
            handleNavigateToSection('live-grid');
          }}
        />

       

        

        

        
      </main>

      {/* Clean Academic Footer */}
      <Footer />
    </div>
  );
}