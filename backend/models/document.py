from typing import Literal

from pydantic import BaseModel

from models.span import Span


class Document(BaseModel):
    id: str
    filename: str
    text: str
    uploaded_at: str


class AnalysisRequest(BaseModel):
    text: str
    filename: str
    mode: Literal["trust", "batch", "correction"]


class AnalysisResult(BaseModel):
    session_id: str
    document: Document
    spans: list[Span]
    mode: Literal["trust", "batch", "correction"]
