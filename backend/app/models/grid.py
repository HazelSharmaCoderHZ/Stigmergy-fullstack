from pydantic import BaseModel, Field


class BusState(BaseModel):
    id: int
    voltage_pu: float
    angle_deg: float
    nominal_voltage_kv: float
    generation_mw: float
    load_mw: float


class LineState(BaseModel):
    id: int
    from_bus: int
    to_bus: int
    loading_percent: float
    p_from_mw: float
    p_to_mw: float


class GridState(BaseModel):
    network: str
    converged: bool
    bus_count: int
    line_count: int
    total_generation_mw: float
    total_load_mw: float
    min_voltage_pu: float
    max_voltage_pu: float
    max_line_loading_percent: float
    buses: list[BusState] = Field(default_factory=list)
    lines: list[LineState] = Field(default_factory=list)
