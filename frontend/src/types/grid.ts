export type GridNodeType = 
  | 'solar' 
  | 'wind' 
  | 'hydro' 
  | 'storage' 
  | 'substation' 
  | 'industrial' 
  | 'commercial' 
  | 'residential' 
  | 'hospital';

export type NodeStatus = 'stable' | 'warning' | 'congestion' | 'surplus';

export interface GridNode {
  id: string;
  name: string;
  zoneCode: string;
  type: GridNodeType;
  x: number; // 0-100 relative coordinate on map canvas
  y: number; // 0-100 relative coordinate on map canvas
  energyLevel: number; // 0 - 100%
  currentLoad: number; // 0 - 100%
  capacityMW: number;
  currentLoadMW: number;
  generationMW: number;
  incomingMW: number;
  outgoingMW: number;
  voltageKV: number;
  status: NodeStatus;
  pheromoneIntensity: number; // 0.0 - 1.0
  activePheromoneType?: PheromoneType;
  assignedAgentId?: string;
}

export interface GridLink {
  id: string;
  source: string; // node ID
  target: string; // node ID
  capacityMW: number;
  currentFlowMW: number;
  status: 'normal' | 'congested' | 'rerouted' | 'fault';
  pheromoneTraces: number; // 0.0 - 1.0 (digital trail on line)
}

export type PheromoneType = 
  | 'DEMAND_SIGNAL' 
  | 'ENERGY_SURPLUS' 
  | 'CONGESTION_GRADIENT' 
  | 'PRIORITY_DISPATCH' 
  | 'LOAD_PRESSURE' 
  | 'AVAILABLE_CAPACITY';

export interface ActiveSignal {
  id: string;
  type: PheromoneType;
  originNodeId: string;
  radius: number; // in map units
  maxRadius: number;
  intensity: number; // 0.0 to 1.0
  decayRate: number;
  color: string;
  createdTime: number;
}

export type AgentRole = 
  | 'Grid Monitor' 
  | 'Energy Distributor' 
  | 'Storage Manager' 
  | 'Load Balancer' 
  | 'Demand Predictor'
  | 'Renewable Harvester';

export type AgentState = 'sensing' | 'signaling' | 'rerouting' | 'balancing' | 'discharging';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  currentZoneId: string;
  state: AgentState;
  action: string;
  sensedSignal?: PheromoneType;
  signalStrength: number; // 0 - 100%
  lastZoneVisited: string;
  adaptationScore: number; // efficiency rating
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  agentId?: string;
  zoneId?: string;
  signalType?: PheromoneType;
  message: string;
  severity: 'info' | 'warning' | 'alert' | 'success';
}

export interface SimulationParams {
  speed: 1 | 2 | 5;
  isPaused: boolean;
  demandFactor: number; // 0.5 to 1.8
  renewableSupply: number; // 0.3 to 1.7
  agentDensity: number; // 1 to 10
  decayRate: number; // 0.02 (slow) to 0.15 (fast)
  storageReserve: number; // 20% to 100%
  activeScenario?: string;
}

export interface SystemMetrics {
  totalGenerationMW: number;
  totalDemandMW: number;
  gridEfficiency: number;
  activeAgentsCount: number;
  signalDensity: number;
  frequencyHz: number;
  congestionRate: number;
  carbonIntensity: number;
}
