import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getAgentState,
  getGridState,
  runCoordinationTick,
  type BackendAgent,
  type BackendGridState,
  type ProposalDiagnostic,
} from './services/api';
import { Agent, GridLink, GridNode, SystemMetrics } from './types/grid';
import { INITIAL_NODES } from './data/gridData';
import { Header } from './components/Header';
import { SmartGridMapSection } from './components/SmartGridMapSection';
import { StigmergyVisualizer } from './components/StigmergyVisualizer';
import { ControlDashboard } from './components/ControlDashboard';
import { AgentNetwork } from './components/AgentNetwork';
import { Footer } from './components/Footer';
import { ElectricMeshBackground } from './components/ElectricMeshBackground';
import { ElectricityVideoSection } from './components/ElectricityVideoSection';

type BackendStatus = 'connecting' | 'connected' | 'error';
type Snapshot = { timestamp: string; generation: number; demand: number };

const busNodeId = (busId: number) => `node-${String(busId + 1).padStart(2, '0')}`;

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function mapAgents(
  backendAgents: BackendAgent[],
  diagnostics: ProposalDiagnostic[] = [],
): Agent[] {
  const diagnosticByAgent = new Map(diagnostics.map((entry) => [entry.agent_id, entry]));
  return backendAgents.map((agent) => {
    const diagnostic = diagnosticByAgent.get(agent.agent_id);
    const demand = diagnostic?.trail_sensed.demand
      ?? Number(agent.metadata?.trail_demand_signal ?? 0);
    const surplus = diagnostic?.trail_sensed.energy_surplus
      ?? Number(agent.metadata?.trail_energy_surplus ?? 0);
    return {
      id: agent.agent_id,
      name: agent.name,
      role: agent.role,
      currentZoneId: busNodeId(agent.current_zone_id),
      state: agent.state,
      action: agent.action,
      sensedSignal: agent.sensed_signal,
      signalStrength: agent.signal_strength ?? 0,
      adaptationScore: undefined,
      trailDemandSignal: demand,
      trailEnergySurplus: surplus,
      lastZoneVisited: undefined,
    } as Agent;
  });
}

export default function App() {
  // INITIAL_NODES supplies only the existing canvas coordinates and styling.
  const [grid, setGrid] = useState<BackendGridState | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [diagnostics, setDiagnostics] = useState<ProposalDiagnostic[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('connecting');
  const [backendError, setBackendError] = useState('');
  const [lastBackendUpdate, setLastBackendUpdate] = useState<Date | null>(null);
  const [tick, setTick] = useState<number | null>(null);
  const [tickPending, setTickPending] = useState(false);
  const [pollingPaused, setPollingPaused] = useState(false);
  const tickInFlight = useRef(false);
  const readInFlight = useRef(false);
  const [showPheromones, setShowPheromones] = useState(true);
  const [showEnergyFlow, setShowEnergyFlow] = useState(true);
  const [showAgents, setShowAgents] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [tickNonce, setTickNonce] = useState(0);

  const applyGridSnapshot = useCallback((snapshot: BackendGridState) => {
    setGrid(snapshot);
    setHistory((previous) => [
      ...previous,
      {
        timestamp: formatTimestamp(),
        generation: snapshot.total_generation_mw,
        demand: snapshot.total_load_mw,
      },
    ].slice(-50));
  }, []);

  const refreshBackend = useCallback(async () => {
    if (readInFlight.current) return;
    readInFlight.current = true;
    setBackendStatus('connecting');
    try {
      const [gridState, agentState] = await Promise.all([getGridState(), getAgentState()]);
      applyGridSnapshot(gridState);
      setAgents(mapAgents(agentState.agents));
      setBackendStatus('connected');
      setBackendError('');
      setLastBackendUpdate(new Date());
    } catch (error) {
      setBackendStatus('error');
      setBackendError(error instanceof Error ? error.message : 'Unable to connect to backend');
    } finally {
      readInFlight.current = false;
    }
  }, [applyGridSnapshot]);

  // Read-only polling is sequential; a slow request cannot overlap the next poll.
  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    const poll = async () => {
      if (!active || pollingPaused) return;
      if (readInFlight.current) {
        timer = window.setTimeout(() => void poll(), 250);
        return;
      }
      readInFlight.current = true;
      try {
        const [gridState, agentState] = await Promise.all([getGridState(), getAgentState()]);
        if (!active) return;
        applyGridSnapshot(gridState);
        setAgents(mapAgents(agentState.agents));
        setBackendStatus('connected');
        setBackendError('');
        setLastBackendUpdate(new Date());
      } catch (error) {
        if (!active) return;
        setBackendStatus('error');
        setBackendError(error instanceof Error ? error.message : 'Unable to connect to backend');
      } finally {
        readInFlight.current = false;
        if (active) timer = window.setTimeout(() => void poll(), 5000);
      }
    };

    void poll();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [applyGridSnapshot, pollingPaused]);

  const handleRunTick = useCallback(async () => {
    if (tickInFlight.current || readInFlight.current || backendStatus !== 'connected') return;
    tickInFlight.current = true;
    setTickPending(true);
    try {
      const result = await runCoordinationTick();
      applyGridSnapshot(result.grid);
      setAgents(mapAgents(result.agents, result.proposal_diagnostics));
      setDiagnostics(result.proposal_diagnostics);
      setTick(result.tick);
      setBackendStatus('connected');
      setBackendError('');
      setLastBackendUpdate(new Date());
      setTickNonce((n) => n + 1);
    } catch (error) {
      setBackendStatus('error');
      setBackendError(error instanceof Error ? error.message : 'Coordination tick failed');
    } finally {
      tickInFlight.current = false;
      setTickPending(false);
    }
  }, [applyGridSnapshot, backendStatus]);

  const displayNodes = useMemo<GridNode[]>(() => INITIAL_NODES.map((layoutNode, index) => {
    const busId = index;
    const bus = grid?.buses.find((candidate) => candidate.id === busId);
    const agent = agents.find((candidate) => candidate.currentZoneId === layoutNode.id);
    const demandTrail = (agent as (Agent & { trailDemandSignal?: number }) | undefined)?.trailDemandSignal ?? 0;
    const surplusTrail = (agent as (Agent & { trailEnergySurplus?: number }) | undefined)?.trailEnergySurplus ?? 0;
    const sensedType = demandTrail === 0 && surplusTrail === 0
      ? undefined
      : demandTrail >= surplusTrail ? 'DEMAND_SIGNAL' : 'ENERGY_SURPLUS';
    return {
      ...layoutNode,
      id: busNodeId(busId),
      name: `IEEE-14 Bus ${busId}`,
      zoneCode: `BUS-${String(busId).padStart(2, '0')}`,
      type: 'substation',
      energyLevel: undefined,
      capacityMW: undefined,
      currentLoad: undefined,
      currentLoadMW: bus?.load_mw,
      generationMW: bus?.generation_mw,
      incomingMW: undefined,
      outgoingMW: undefined,
      voltagePU: bus?.voltage_pu,
      voltageKV: bus ? bus.voltage_pu * bus.nominal_voltage_kv : undefined,
      status: bus && (bus.voltage_pu < 0.95 || bus.voltage_pu > 1.05) ? 'warning' : 'stable',
      pheromoneIntensity: Math.max(demandTrail, surplusTrail),
      activePheromoneType: sensedType,
      assignedAgentId: agent?.id,
    };
  }), [agents, grid]);

  const displayLinks = useMemo<GridLink[]>(() => (grid?.lines ?? []).map((line) => {
    const forward = line.p_from_mw >= 0;
    return {
      id: `line-${line.id}`,
      source: busNodeId(forward ? line.from_bus : line.to_bus),
      target: busNodeId(forward ? line.to_bus : line.from_bus),
      currentFlowMW: Math.abs(line.p_from_mw),
      capacityMW: undefined,
      loadingPercent: line.loading_percent,
      pheromoneTraces: 0,
      status: line.loading_percent >= 100 ? 'congested' : 'normal',
    };
  }), [grid]);

  const metrics = useMemo<SystemMetrics>(() => ({
    totalGenerationMW: grid?.total_generation_mw,
    totalDemandMW: grid?.total_load_mw,
    activeAgentsCount: agents.length || undefined,
    minVoltagePU: grid?.min_voltage_pu,
    maxVoltagePU: grid?.max_voltage_pu,
    maxLineLoadingPercent: grid?.max_line_loading_percent,
    converged: grid?.converged,
  }), [agents.length, grid]);

  const selectedNode = selectedNodeId
    ? displayNodes.find((node) => node.id === selectedNodeId) ?? null
    : null;

  const handleNavigateToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Header
        activeTab={activeTab}
        onSelectTab={handleNavigateToSection}
        frequencyHz={undefined}
        isPaused={pollingPaused}
        onTogglePause={() => setPollingPaused((paused) => !paused)}
        onResetGrid={() => void refreshBackend()}
        onTriggerSurge={() => void handleRunTick()}
        tickPending={tickPending}
      />

      <main className="flex-1">
        <section id="overview" className="relative min-h-[58vh] flex items-center overflow-hidden border-b border-slate-200 bg-white">
          <ElectricMeshBackground />
          <div className="fade-in-up relative z-10 mx-auto w-full max-w-5xl px-6 py-20">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Research prototype · IEEE-14</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">StigGrid: stigmergic coordination for power systems</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Bus agents sense local voltage and shared decaying trails. Proposed generator setpoints are evaluated by a SafetyGate before accepted changes are applied.</p>
            <p className="mt-5 text-sm text-slate-500">Use Grid to inspect live measurements and Agents to review the current agent states. Coordination ticks are requested explicitly.</p>
            <button onClick={() => handleNavigateToSection('live-grid')} className="mt-8 border border-blue-700 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50">Open grid</button>
          </div>
        </section>
        <SmartGridMapSection
          nodes={displayNodes} links={displayLinks} agents={agents}
          selectedNode={selectedNode} onSelectNode={(node) => setSelectedNodeId(node?.id ?? null)}
          showPheromones={showPheromones} showEnergyFlow={showEnergyFlow} showAgents={showAgents}
          onTogglePheromones={() => setShowPheromones((value) => !value)}
          onToggleEnergyFlow={() => setShowEnergyFlow((value) => !value)}
          onToggleAgents={() => setShowAgents((value) => !value)}
          onTriggerSurge={() => void handleRunTick()} tickPending={tickPending}
          tickNonce={tickNonce}
        />
        <ControlDashboard metrics={metrics} history={history} backendStatus={backendStatus} backendError={backendError} />
        <AgentNetwork agents={agents} nodes={displayNodes} tickNonce={tickNonce} onSelectNode={(node) => {
          if (!node) return;
          setSelectedNodeId(node.id);
          handleNavigateToSection('live-grid');
        }} />
        <StigmergyVisualizer />
        <ElectricityVideoSection />
        <section id="decisions" className="scroll-mt-20 border-b border-slate-200 bg-white py-10" aria-live="polite">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">05 · Safety and decisions</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Latest coordination tick</h2>
            <p className="mt-2 text-sm text-slate-600">Decisions, proposal outcomes, and reasons. Trail readings were sensed before this tick's deposits.</p>
            {diagnostics.length === 0 ? <p className="mt-3 text-sm text-slate-500">Run a coordination tick to load agent decisions and proposal outcomes.</p> : (
              <div className="mt-3 overflow-x-auto rounded border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-mono uppercase text-slate-500"><tr><th className="p-2">Agent / Bus</th><th className="p-2">Decision</th><th className="p-2">Trail sensed (demand / surplus)</th><th className="p-2">Proposal</th><th className="p-2">Reason</th></tr></thead>
                  <tbody>{diagnostics.map((item) => <tr key={item.agent_id} className="border-t border-slate-100"><td className="p-2 font-mono">{item.agent_id} / BUS-{String(item.bus_id).padStart(2, '0')}</td><td className="p-2">{item.decision}</td><td className="p-2 font-mono">{item.trail_sensed.demand.toFixed(4)} / {item.trail_sensed.energy_surplus.toFixed(4)}</td><td className="p-2 uppercase">{item.status}{item.proposal_status ? ` / ${item.proposal_status}` : ''}</td><td className="p-2">{item.reason}{item.trail_deposited ? `; deposited for later ticks: ${item.trail_deposited}` : ''}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
