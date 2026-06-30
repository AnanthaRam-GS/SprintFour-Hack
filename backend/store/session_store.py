from __future__ import annotations

from threading import Lock

from models import AuditEntry, Session, Span, SpanAction

_sessions: dict[str, Session] = {}
_session_lock = Lock()


def set_session(session_id: str, session: Session) -> None:
    with _session_lock:
        _sessions[session_id] = session


def get_session(session_id: str) -> Session | None:
    with _session_lock:
        return _sessions.get(session_id)


def delete_session(session_id: str) -> bool:
    with _session_lock:
        if session_id not in _sessions:
            return False
        del _sessions[session_id]
        return True


def append_audit(session_id: str, entry: AuditEntry) -> bool:
    with _session_lock:
        session = _sessions.get(session_id)
        if session is None:
            return False
        session.audit_log.append(entry)
        return True


def update_span_decision(session_id: str, span_id: str, action: SpanAction) -> bool:
    with _session_lock:
        session = _sessions.get(session_id)
        if session is None:
            return False

        for span in session.spans:
            if span.id == span_id:
                span.decision = action
                return True

        return False


def add_span(session_id: str, span: Span) -> bool:
    with _session_lock:
        session = _sessions.get(session_id)
        if session is None:
            return False
        session.spans.append(span)
        return True


def list_sessions() -> list[Session]:
    with _session_lock:
        return list(_sessions.values())
