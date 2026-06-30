from typing import Literal, Optional

from pydantic import BaseModel, Field

from models.document import Document
from models.span import Span, SpanAction, SpanType

BatchStatus = Literal["queued", "processing", "needs_review", "approved", "rejected"]


class AuditEntry(BaseModel):
    timestamp: str
    span_id: str
    span_text: str
    span_type: SpanType
    action: SpanAction
    confidence: float


class DecisionRequest(BaseModel):
    session_id: str
    span_id: str
    action: SpanAction
    new_span: Optional[Span] = None


class Session(BaseModel):
    session_id: str
    document: Document
    spans: list[Span]
    audit_log: list[AuditEntry] = Field(default_factory=list)
    mode: Literal["trust", "batch", "correction"]


class BatchJob(BaseModel):
    job_id: str
    filename: str
    status: BatchStatus
    session_id: Optional[str] = None
    span_count: Optional[int] = None
    processed_at: Optional[str] = None
