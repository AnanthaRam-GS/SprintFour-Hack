import csv
import io
import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from models import Session
from services.redactor import redact_text


def _sanitize_filename(filename: str) -> str:
    sanitized = filename.replace("/", "_").replace("\\", "_").strip()
    return sanitized or "document.txt"


def _build_redacted_filename(filename: str) -> str:
    path = Path(filename)
    stem = path.stem or "document"
    suffix = path.suffix or ".txt"
    return f"redacted_{stem}{suffix}"


def build_session_export_zip(session: Session) -> bytes:
    original_filename = _sanitize_filename(session.document.filename)
    redacted_filename = _build_redacted_filename(original_filename)
    redacted_document = redact_text(session.document.text, session.spans)

    reviewed_spans = sum(1 for span in session.spans if span.decision is not None)
    manifest = {
        "session_id": session.session_id,
        "filename": original_filename,
        "mode": session.mode,
        "total_spans": len(session.spans),
        "reviewed_spans": reviewed_spans,
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }

    audit_buffer = io.StringIO()
    writer = csv.writer(audit_buffer)
    writer.writerow(["timestamp", "span_text", "span_type", "action", "confidence"])
    for entry in session.audit_log:
        writer.writerow(
            [
                entry.timestamp,
                entry.span_text,
                entry.span_type,
                entry.action,
                entry.confidence,
            ]
        )

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr(redacted_filename, redacted_document)
        zip_file.writestr("audit_log.csv", audit_buffer.getvalue())
        zip_file.writestr("manifest.json", json.dumps(manifest, indent=2))

    return zip_buffer.getvalue()
