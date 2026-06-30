from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from models import AnalysisRequest, AnalysisResult, Document, Session
from services import detect_pii
from store import set_session

router = APIRouter(prefix="/api/v1", tags=["analyze"])


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_document(request: AnalysisRequest) -> AnalysisResult:
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty")

    filename = request.filename.strip() or "untitled.txt"
    session_id = str(uuid4())
    document = Document(
        id=str(uuid4()),
        filename=filename,
        text=request.text,
        uploaded_at=datetime.now(timezone.utc).isoformat(),
    )
    spans = await detect_pii(request.text, request.mode)

    session = Session(
        session_id=session_id,
        document=document,
        spans=spans,
        audit_log=[],
        mode=request.mode,
    )
    set_session(session_id, session)

    return AnalysisResult(
        session_id=session_id,
        document=document,
        spans=spans,
        mode=request.mode,
    )
