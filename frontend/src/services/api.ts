const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export interface BackendBus {
  id: number;
  voltage_pu: number;
  angle_deg: number;
  nominal_voltage_kv: number;
  generation_mw: number;
  load_mw: number;
}

export interface BackendLine {
  id: number;
  from_bus: number;
  to_bus: number;
  loading_percent: number;
  p_from_mw: number;
  p_to_mw: number;
}

export interface BackendGridState {
  network: string;
  converged: boolean;
  bus_count: number;
  line_count: number;
  total_generation_mw: number;
  total_load_mw: number;
  min_voltage_pu: number;
  max_voltage_pu: number;
  max_line_loading_percent: number;
  buses: BackendBus[];
  lines: BackendLine[];
}

export interface BackendAgent {
  agent_id: string;
  name: string;
  role: string;
  current_zone_id: number;
  state: string;
  action: string;
  sensed_signal?: string | null;
  signal_strength?: number;
  adaptation_score?: number;
  metadata?: Record<string, unknown>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!response.ok) {
    throw new Error(
      `Backend request failed (${response.status}): ${await response.text()}`,
    );
  }

  return response.json() as Promise<T>;
}

export function getGridState() {
  return request<BackendGridState>("/api/grid/state");
}

export function getAgentState() {
  return request<{ count: number; agents: BackendAgent[] }>("/api/agents/state");
}

export function runCoordinationTick() {
  return request<{
    tick: number;
    grid: BackendGridState;
    agents: BackendAgent[];
    coordination: {
      agent_count: number;
      mechanism: string;
      direct_agent_messaging: boolean;
    };
    note: string;
  }>("/api/coordination/tick", { method: "POST" });
}
