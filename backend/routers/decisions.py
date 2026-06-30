from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models import AuditEntry, DecisionRequest
from store import add_span, append_audit, get_session, update_span_decision

router = APIRouter(prefix="/api/v1", tags=["decisions"])


class DecisionResponse(BaseModel):
    ok: bool
    audit_entry: AuditEntry


@router.post("/decisions", response_model=DecisionResponse)
async def record_decision(request: DecisionRequest) -> DecisionResponse:
    session = get_session(request.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if request.action == "add":
        if request.new_span is None:
            raise HTTPException(
                status_code=400,
                detail="new_span is required when action is add",
            )

        span = request.new_span.model_copy(
            update={
                "decision": "add",
                "is_suggested": False,
            }
        )
        add_span(request.session_id, span)
    else:
        span = next((item for item in session.spans if item.id == request.span_id), None)
        if span is None:
            raise HTTPException(status_code=404, detail="Span not found")

        update_span_decision(request.session_id, request.span_id, request.action)
        span = span.model_copy(update={"decision": request.action})

    audit_entry = AuditEntry(
        timestamp=datetime.now(timezone.utc).isoformat(),
        span_id=span.id,
        span_text=span.text,
        span_type=span.type,
        action=request.action,
        confidence=span.confidence,
    )
    append_audit(request.session_id, audit_entry)

    return DecisionResponse(ok=True, audit_entry=audit_entry)
