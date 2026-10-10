import math
from dataclasses import asdict
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.grid.environment import GridEnvironment
from app.models.grid import GridState
from app.models.actions import (
    GeneratorActionRequest,
    GeneratorActionResponse,
)
from app.safety.safety_gate import SafetyGate
from app.agents.grid_agent import GridAgent
from app.trail.memory import TrailMemory
from app.ai_analyst import AiUnavailable, analyze_snapshot, is_configured, setup_message


app = FastAPI(
    title="StigGrid Backend",
    description=(
        "Stigmergic Multi-Agent Smart Grid "
        "Simulation Backend"
    ),
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Shared grid and safety gate
grid_environment = GridEnvironment()
grid_environment.run_power_flow()
safety_gate = SafetyGate()

# Shared stigmergic trail
trail_memory = TrailMemory(diffusion_rate=0.5)
trail_memory.set_topology(grid_environment.get_topology())

# One monitoring agent per bus
initial_state = grid_environment.get_grid_state()
agents = [
    GridAgent(
        f"agent-{bus.id:02d}",
        f"Grid Monitor {bus.id}",
        "Grid Monitor",
        bus.id,
    )
    for bus in initial_state.buses
]

coordination_tick = 0
last_analyst_snapshot = None


@app.get("/")
def root():
    return {
        "project": "StigGrid",
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/api/grid/state", response_model=GridState)
def get_grid_state():
    try:
        grid_environment.run_power_flow()
        return grid_environment.get_grid_state()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Grid power flow failed: {exc}",
        )


@app.post(
    "/api/safety/generator-action",
    response_model=GeneratorActionResponse,
)
def submit_generator_action(request: GeneratorActionRequest):
    result = safety_gate.evaluate_generator_action(
        environment=grid_environment,
        generator_id=request.generator_id,
        target_p_mw=request.target_p_mw,
        agent_id=request.agent_id,
    )
    return result


@app.get("/api/agents/state")
def get_agent_states():
    return {
        "count": len(agents),
        "agents": [
            asdict(agent.snapshot())
            for agent in agents
        ],
    }


# Conservative experimental setpoint change per coordination tick.
GENERATOR_STEP_MW = 1.0


def _as_dict(value):
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "__dict__") and not isinstance(value, dict):
        return {
            key: getattr(value, key)
            for key in (
                "converged",
                "total_generation_mw",
                "total_load_mw",
                "min_voltage_pu",
                "max_voltage_pu",
                "max_line_loading_percent",
                "buses",
                "lines",
            )
            if hasattr(value, key)
        }
    return dict(value) if value else {}


def summarize_grid(grid) -> dict:
    """Compact grid facts for the analyst. Omits the full bus/line tables."""
    data = _as_dict(grid)
    buses = data.get("buses") or []
    lines = data.get("lines") or []

    def bus_row(bus):
        return bus if isinstance(bus, dict) else {
            "id": getattr(bus, "id", None),
            "voltage_pu": getattr(bus, "voltage_pu", None),
        }

    def line_row(line):
        return line if isinstance(line, dict) else {
            "id": getattr(line, "id", None),
            "from_bus": getattr(line, "from_bus", None),
            "to_bus": getattr(line, "to_bus", None),
            "loading_percent": getattr(line, "loading_percent", None),
        }

    voltage_issues = []
    for bus in buses:
        row = bus_row(bus)
        voltage = row.get("voltage_pu")
        if voltage is None:
            continue
        if voltage < 0.95 or voltage > 1.05:
            voltage_issues.append({
                "bus_id": row.get("id"),
                "voltage_pu": round(float(voltage), 4),
            })

    line_issues = []
    for line in lines:
        row = line_row(line)
        loading = row.get("loading_percent")
        if loading is None:
            continue
        if float(loading) >= 80:
            line_issues.append({
                "id": row.get("id"),
                "from_bus": row.get("from_bus"),
                "to_bus": row.get("to_bus"),
                "loading_percent": round(float(loading), 2),
            })

    return {
        "converged": data.get("converged"),
        "total_generation_mw": data.get("total_generation_mw"),
        "total_load_mw": data.get("total_load_mw"),
        "min_voltage_pu": data.get("min_voltage_pu"),
        "max_voltage_pu": data.get("max_voltage_pu"),
        "max_line_loading_percent": data.get("max_line_loading_percent"),
        "voltage_outside_0.95_1.05_pu": voltage_issues[:8],
        "lines_loading_ge_80pct": line_issues[:8],
    }


def get_generator_for_bus(bus_id: int):
    """Return the first in-service net.gen row attached to a bus."""
    net = grid_environment.network

    for generator_id, generator in net.gen.iterrows():
        if (
            int(generator["bus"]) == bus_id
            and bool(generator["in_service"])
        ):
            return int(generator_id), generator

    return None, None


def propose_generator_target(agent):
    """
    Translate an agent's local decision into a proposed generator target.
    Returns (proposal, None), or (None, a human-readable skip reason).
    """
    action = agent.state.action

    if action == "reduce_local_generation":
        direction = -1

    elif action == "increase_local_support":
        direction = 1

    elif action == "respond_to_energy_surplus":
        direction = -1

    elif action == "respond_to_demand_signal":
        direction = 1

    else:
        return None, "Agent decision does not request generator setpoint change"

    bus_id = agent.state.current_zone_id
    generator_id, generator = get_generator_for_bus(bus_id)

    # Monitoring agents without a generator cannot control one directly.
    if generator_id is None:
        return None, f"No in-service net.gen row is attached to bus {bus_id}"

    current_mw = float(generator["p_mw"])
    target_mw = current_mw + direction * GENERATOR_STEP_MW

    # Respect generator limits when the network defines finite limits.
    min_mw = generator.get("min_p_mw", 0.0)
    max_mw = generator.get("max_p_mw", float("inf"))

    if min_mw is None or not math.isfinite(float(min_mw)):
        min_mw = 0.0

    if max_mw is None or not math.isfinite(float(max_mw)):
        max_mw = float("inf")

    target_mw = max(float(min_mw), min(float(max_mw), target_mw))

    # Avoid submitting an action that cannot change the setpoint.
    if math.isclose(target_mw, current_mw, abs_tol=1e-9):
        return None, (
            f"Requested {direction:+d} MW change is blocked by generator "
            f"limits at {current_mw:g} MW; target would be a no-op"
        )

    return {
        "agent_id": agent.state.agent_id,
        "generator_id": generator_id,
        "target_p_mw": round(target_mw, 6),
        "previous_p_mw": current_mw,
        "proposed_action": action,
    }, None


class AnalystRequest(BaseModel):
    question: str | None = None


@app.post("/api/coordination/tick")
def run_coordination_tick():
    global coordination_tick, last_analyst_snapshot

    try:
        # 1. Calculate the current electrical state.
        grid_environment.run_power_flow()
        grid_state = grid_environment.get_grid_state()

        # 2. Agents sense their assigned buses.
        for agent in agents:
            agent.sense(grid_state)

        # 3. Agents read the existing shared trail.
        for agent in agents:
            agent.sense_trail(trail_memory)

        # 4. Each agent decides independently.
        for agent in agents:
            agent.decide()

        # Preserve one-tick sensing: decisions use trail_sensed below, before
        # this tick's deposits are made.
        trail_sensed = {
            agent.state.agent_id: {
                "demand": agent.state.metadata.get("trail_demand_signal", 0.0),
                "energy_surplus": agent.state.metadata.get(
                    "trail_energy_surplus", 0.0
                ),
            }
            for agent in agents
        }

        # 5. Convert eligible proposals into safety-gated actions.
        action_log = []
        proposal_diagnostics = []
        proposal_outcomes = {}

        for agent in agents:
            proposal, skip_reason = propose_generator_target(agent)

            if proposal is None:
                proposal_outcomes[agent.state.agent_id] = "skipped"
                proposal_diagnostics.append({
                    "agent_id": agent.state.agent_id,
                    "bus_id": agent.state.current_zone_id,
                    "decision": agent.state.action,
                    "status": "skipped",
                    "reason": skip_reason,
                    "trail_sensed": trail_sensed[agent.state.agent_id],
                    "trail_deposited": None,
                })
                continue

            result = safety_gate.evaluate_generator_action(
                environment=grid_environment,
                generator_id=proposal["generator_id"],
                target_p_mw=proposal["target_p_mw"],
                agent_id=proposal["agent_id"],
            )

            if hasattr(result, "model_dump"):
                result_data = result.model_dump()
            elif hasattr(result, "__dataclass_fields__"):
                result_data = asdict(result)
            else:
                result_data = dict(result)

            accepted = result_data.get("accepted", False)
            proposal_outcomes[agent.state.agent_id] = (
                "accepted" if accepted else "rejected"
            )

            action_log.append({
                **proposal,
                "accepted": accepted,
                "reason": result_data.get("reason", "No reason returned"),
                "result": result_data,
            })
            proposal_diagnostics.append({
                "agent_id": agent.state.agent_id,
                "bus_id": agent.state.current_zone_id,
                "decision": agent.state.action,
                "generator_id": proposal["generator_id"],
                "target_p_mw": proposal["target_p_mw"],
                "status": "accepted" if accepted else "rejected",
                "proposal_status": "evaluated",
                "reason": result_data.get("reason", "No reason returned"),
                "trail_sensed": trail_sensed[agent.state.agent_id],
                "trail_deposited": None,
            })

        # 6. Deposits follow proposal outcomes. Do not deposit a surplus
        # correction signal when the corresponding action did not succeed.
        trail_deposited = {}
        diagnostic_by_agent = {
            item["agent_id"]: item for item in proposal_diagnostics
        }
        for agent in agents:
            outcome = proposal_outcomes.get(agent.state.agent_id)
            if (
                agent.state.sensed_signal == "HIGH_VOLTAGE"
                and outcome in {"skipped", "rejected"}
            ):
                deposited_type = None
            else:
                deposited_type = agent.deposit_signal(trail_memory)
            trail_deposited[agent.state.agent_id] = deposited_type
            diagnostic_by_agent[agent.state.agent_id]["trail_deposited"] = deposited_type

        # 7. Recalculate the final state after all accepted actions.
        grid_environment.run_power_flow()
        final_grid_state = grid_environment.get_grid_state()

        coordination_tick += 1

        last_analyst_snapshot = {
            "tick": coordination_tick,
            "before": summarize_grid(grid_state),
            "after": summarize_grid(final_grid_state),
            "proposal_diagnostics": proposal_diagnostics,
            "safety_gate_enabled": True,
            "generator_step_mw": GENERATOR_STEP_MW,
            "note": (
                "Eligible generator proposals were evaluated by the "
                "SafetyGate. Only accepted actions were committed."
            ),
        }

        return {
            "tick": coordination_tick,
            "grid": final_grid_state.model_dump(),
            "agents": [
                asdict(agent.snapshot())
                for agent in agents
            ],
            "actions": action_log,
            "proposal_diagnostics": proposal_diagnostics,
            "trail": {
                "sensing_semantics": "agents sense existing trail before current-tick deposits",
                "deposits_this_tick": {
                    agent_id: signal_type
                    for agent_id, signal_type in trail_deposited.items()
                    if signal_type is not None
                },
            },
            "coordination": {
                "agent_count": len(agents),
                "mechanism": "shared_decaying_trail",
                "direct_agent_messaging": False,
                "safety_gate_enabled": True,
                "generator_step_mw": GENERATOR_STEP_MW,
                "trail_response_threshold": GridAgent.TRAIL_RESPONSE_THRESHOLD,
            },
            "note": (
                "Eligible generator proposals were evaluated by the "
                "SafetyGate. Only accepted actions were committed. "
                "Agents without a generator connection remain monitors."
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Coordination tick failed: {exc}",
        )


@app.post("/api/ai/analyze")
def analyze_latest_tick(payload: AnalystRequest = AnalystRequest()):
    question = payload.question if payload else None

    if last_analyst_snapshot is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "No coordination tick has been run yet. "
                "Run a coordination tick, then ask the analyst."
            ),
        )

    if not is_configured():
        raise HTTPException(status_code=503, detail=setup_message())

    try:
        analysis = analyze_snapshot(last_analyst_snapshot, question)
    except AiUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    return {
        "available": True,
        "tick": last_analyst_snapshot.get("tick"),
        **analysis,
    }
