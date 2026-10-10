
from pydantic import BaseModel, Field, ConfigDict


class GeneratorActionRequest(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)

    agent_id: str = "agent-001"
    generator_id: int = Field(ge=0)
    target_p_mw: float


class GeneratorActionResponse(BaseModel):
    accepted: bool
    reason: str
    agent_id: str
    generator_id: int
    previous_p_mw: float | None = None
    accepted_p_mw: float | None = None
