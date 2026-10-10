from dataclasses import dataclass
from enum import Enum


class PheromoneType(str, Enum):
    DEMAND_SIGNAL = "DEMAND_SIGNAL"
    ENERGY_SURPLUS = "ENERGY_SURPLUS"
    CONGESTION_GRADIENT = "CONGESTION_GRADIENT"
    PRIORITY_DISPATCH = "PRIORITY_DISPATCH"
    LOAD_PRESSURE = "LOAD_PRESSURE"
    AVAILABLE_CAPACITY = "AVAILABLE_CAPACITY"


@dataclass
class TrailSignal:
    """
    A signal deposited by an agent into the shared environment.
    """

    node_id: int
    signal_type: PheromoneType
    intensity: float

    deposited_by: str

    timestamp: float