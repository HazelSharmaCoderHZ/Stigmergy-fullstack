import math
import time

from app.trail.model import PheromoneType, TrailSignal


class TrailMemory:
    """
    Shared stigmergic environment.

    Agents do not communicate directly.

    Instead:

        Agent -> deposit -> Trail
        Agent <- sense <- Trail

    Signals can propagate through neighboring grid nodes
    with distance-based attenuation and time-based decay.
    """

    def __init__(
        self,
        decay_rate: float = 0.1,
        diffusion_rate: float = 0.5,
    ):
        self.decay_rate = decay_rate
        self.diffusion_rate = diffusion_rate

        self._signals: dict[
            tuple[int, PheromoneType],
            TrailSignal
        ] = {}

        self._neighbors: dict[int, set[int]] = {}

    def set_topology(self, connections: list[tuple[int, int]]):
        """
        Register electrical connectivity.

        Example:

            [(0, 1), (1, 2), (1, 3)]

        creates bidirectional neighborhood relationships.
        """

        self._neighbors.clear()

        for source, target in connections:

            self._neighbors.setdefault(
                source,
                set(),
            ).add(target)

            self._neighbors.setdefault(
                target,
                set(),
            ).add(source)

    def deposit(
        self,
        node_id: int,
        signal_type: PheromoneType,
        intensity: float,
        agent_id: str,
    ):
        """
        Deposit or reinforce a signal at a node.
        """

        intensity = max(
            0.0,
            min(1.0, intensity),
        )

        key = (node_id, signal_type)

        existing = self._signals.get(key)

        if existing:

            existing.intensity = min(
                1.0,
                existing.intensity + intensity,
            )

            existing.timestamp = time.time()
            existing.deposited_by = agent_id

        else:

            self._signals[key] = TrailSignal(
                node_id=node_id,
                signal_type=signal_type,
                intensity=intensity,
                deposited_by=agent_id,
                timestamp=time.time(),
            )

    def _apply_decay(self):

        now = time.time()

        expired = []

        for key, signal in self._signals.items():

            elapsed = now - signal.timestamp

            signal.intensity *= math.exp(
                -self.decay_rate * elapsed
            )

            signal.timestamp = now

            if signal.intensity < 0.001:
                expired.append(key)

        for key in expired:
            del self._signals[key]

    def read(
        self,
        node_id: int,
        signal_type: PheromoneType | None = None,
    ):

        self._apply_decay()

        results = []

        for signal in self._signals.values():

            if signal.node_id != node_id:
                continue

            if (
                signal_type is not None
                and signal.signal_type != signal_type
            ):
                continue

            results.append(signal)

        return results

    def get_intensity(
        self,
        node_id: int,
        signal_type: PheromoneType,
    ) -> float:

        signals = self.read(
            node_id,
            signal_type,
        )

        if not signals:
            return 0.0

        return min(
            1.0,
            sum(
                signal.intensity
                for signal in signals
            ),
        )

    def sense_neighborhood(
        self,
        node_id: int,
        signal_type: PheromoneType,
    ) -> dict[int, float]:
        """
        Sense the local pheromone field around a node.

        Signals deposited at nearby nodes are perceived with
        distance-based attenuation.

        Current implementation:
            distance 0 -> full intensity
            distance 1 -> diffusion_rate * intensity
        """

        self._apply_decay()

        result = {}

        # --------------------------------------------------
        # 1. Signals deposited at the current node
        # --------------------------------------------------

        own_intensity = self.get_intensity(
            node_id,
            signal_type,
        )

        if own_intensity > 0:
            result[node_id] = own_intensity

        # --------------------------------------------------
        # 2. Signals deposited at directly connected nodes
        # --------------------------------------------------

        neighbors = self._neighbors.get(
            node_id,
            set(),
        )

        for neighbor in neighbors:

            neighbor_intensity = self.get_intensity(
                neighbor,
                signal_type,
            )

            if neighbor_intensity <= 0:
                continue

            perceived_intensity = (
                neighbor_intensity
                * self.diffusion_rate
            )

            if perceived_intensity > 0:
                result[neighbor] = perceived_intensity

        return result

    def clear(self):
        self._signals.clear()

    def snapshot(self):

        self._apply_decay()

        return list(
            self._signals.values()
        )