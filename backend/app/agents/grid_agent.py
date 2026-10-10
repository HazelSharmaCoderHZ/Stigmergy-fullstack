
from app.agents.base import BaseAgent
from app.trail.memory import TrailMemory
from app.trail.model import PheromoneType


class GridAgent(BaseAgent):
    """
    Autonomous smart-grid agent.

    Responsibilities:
    - Sense local electrical conditions.
    - Read nearby stigmergic trail signals.
    - Make local decisions without direct agent-to-agent messaging.
    - Deposit signals into shared trail memory.

    Actions are proposals only. Physical grid changes must pass
    through the SafetyGate.
    """

    LOW_VOLTAGE_LIMIT = 0.95
    HIGH_VOLTAGE_LIMIT = 1.05
    # Trail intensities are normalized to [0, 1]. The initial zero threshold
    # makes any positive, non-expired signal eligible without tuning a cutoff
    # above the observed runtime scale (about 0.00454).
    TRAIL_RESPONSE_THRESHOLD = 0.0

    def __init__(
        self,
        agent_id: str,
        name: str,
        role: str,
        zone_id: int,
        trail_response_threshold: float = TRAIL_RESPONSE_THRESHOLD,
    ):
        super().__init__(agent_id, name, role, zone_id)
        self.trail_response_threshold = trail_response_threshold

    def sense(self, grid_state):
        """Observe voltage at the agent's assigned bus."""
        bus = next(
            (
                bus
                for bus in grid_state.buses
                if bus.id == self.state.current_zone_id
            ),
            None,
        )

        if bus is None:
            self.state.sensed_signal = None
            self.state.signal_strength = 0.0
            return

        voltage = bus.voltage_pu

        if voltage < self.LOW_VOLTAGE_LIMIT:
            self.state.sensed_signal = "LOW_VOLTAGE"
            self.state.signal_strength = min(
                100.0,
                (self.LOW_VOLTAGE_LIMIT - voltage) * 1000.0,
            )

        elif voltage > self.HIGH_VOLTAGE_LIMIT:
            self.state.sensed_signal = "HIGH_VOLTAGE"
            self.state.signal_strength = min(
                100.0,
                (voltage - self.HIGH_VOLTAGE_LIMIT) * 1000.0,
            )

        else:
            self.state.sensed_signal = "NORMAL"
            self.state.signal_strength = 0.0

    def sense_trail(self, trail: TrailMemory):
        """Read demand and energy-surplus signals from nearby buses."""
        demand_signals = trail.sense_neighborhood(
            self.state.current_zone_id,
            PheromoneType.DEMAND_SIGNAL,
        )

        surplus_signals = trail.sense_neighborhood(
            self.state.current_zone_id,
            PheromoneType.ENERGY_SURPLUS,
        )

        self.state.metadata["trail_demand_signal"] = max(
            demand_signals.values(),
            default=0.0,
        )

        self.state.metadata["trail_energy_surplus"] = max(
            surplus_signals.values(),
            default=0.0,
        )

    def decide(self):
        """
        Select an action using local voltage first, then trail signals.

        Local electrical conditions take priority over indirect signals.
        This method proposes actions; it does not change the grid.
        """
        local_signal = self.state.sensed_signal

        demand_signal = self.state.metadata.get(
            "trail_demand_signal",
            0.0,
        )

        surplus_signal = self.state.metadata.get(
            "trail_energy_surplus",
            0.0,
        )

        # Priority 1: respond to the agent's local voltage condition.
        if local_signal == "LOW_VOLTAGE":
            self.state.state = "balancing"
            self.state.action = "increase_local_support"
            return

        if local_signal == "HIGH_VOLTAGE":
            self.state.state = "balancing"
            self.state.action = "reduce_local_generation"
            return

        # Priority 2: respond to nearby energy-surplus trail signals.
        if surplus_signal > 0 and surplus_signal >= self.trail_response_threshold:
            self.state.state = "balancing"
            self.state.action = "respond_to_energy_surplus"
            return

        # Priority 3: respond to nearby demand trail signals.
        if demand_signal > 0 and demand_signal >= self.trail_response_threshold:
            self.state.state = "balancing"
            self.state.action = "respond_to_demand_signal"
            return

        # No abnormal local condition or actionable trail signal.
        self.state.state = "sensing"
        self.state.action = "monitoring"

    def deposit_signal(self, trail: TrailMemory):
        """Deposit the agent's locally observed condition into the trail."""
        signal = self.state.sensed_signal

        intensity = max(
            0.0,
            min(1.0, self.state.signal_strength / 100.0),
        )

        if signal == "LOW_VOLTAGE":
            trail.deposit(
                node_id=self.state.current_zone_id,
                signal_type=PheromoneType.DEMAND_SIGNAL,
                intensity=intensity,
                agent_id=self.state.agent_id,
            )
            return PheromoneType.DEMAND_SIGNAL.value

        elif signal == "HIGH_VOLTAGE":
            trail.deposit(
                node_id=self.state.current_zone_id,
                signal_type=PheromoneType.ENERGY_SURPLUS,
                intensity=intensity,
                agent_id=self.state.agent_id,
            )
            return PheromoneType.ENERGY_SURPLUS.value

        return None
