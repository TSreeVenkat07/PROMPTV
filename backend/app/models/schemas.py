from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional, List
from uuid import UUID
from datetime import datetime

class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    prompt: str = Field(min_length=10, max_length=4000)
    mode: Literal["build","analyze","recovery"] = "analyze"

class GenerateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    idea: str = Field(min_length=10, max_length=2000)
    tech_stack: str = Field(default="", max_length=500)

class RecoverRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    problem: str = Field(min_length=10, max_length=4000)

class ExportRequest(BaseModel):
    prompt_id: UUID
    format: Literal["markdown","json","cursor","text"]

class TemplateResponse(BaseModel):
    id: UUID
    name: str
    category: str
    content: str
    tags: List[str]

class VersionResponse(BaseModel):
    version_number: int
    content: str
    score: int
    diff_summary: str
    created_at: datetime
