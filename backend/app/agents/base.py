from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentState:
    """
    Runtime state of an autonomous grid agent.
    """

    agent_id: str
    name: str
    role: str
    current_zone_id: int

    state: str = "sensing"
    action: str = "monitoring"

    sensed_signal: str | None = None
    signal_strength: float = 0.0

    adaptation_score: float = 0.0

    metadata: dict[str, Any] = field(default_factory=dict)


class BaseAgent(ABC):
    """
    Base class for all StigGrid autonomous agents.

    Agents:
    - observe their local environment
    - make local decisions
    - propose actions

    They do NOT directly communicate with other agents.
    """

    def __init__(
        self,
        agent_id: str,
        name: str,
        role: str,
        zone_id: int,
    ):
        self.state = AgentState(
            agent_id=agent_id,
            name=name,
            role=role,
            current_zone_id=zone_id,
        )

    @abstractmethod
    def sense(self, grid_state):
        """
        Observe the local grid environment.
        """
        pass

    @abstractmethod
    def decide(self):
        """
        Make a local decision based on sensed information.
        """
        pass

    def snapshot(self) -> AgentState:
        """
        Return the current agent state.
        """
        return self.state