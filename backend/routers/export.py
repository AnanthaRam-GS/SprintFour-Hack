import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.exporter import build_session_export_zip
from store import get_session

router = APIRouter(prefix="/api/v1", tags=["export"])


@router.get("/export/{session_id}")
async def export_session(session_id: str) -> StreamingResponse:
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    zip_bytes = build_session_export_zip(session)
    filename = f"conseal_export_{session_id}.zip"

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
