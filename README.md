# Conseal

AI-powered privacy review platform that detects, reviews, explains, and exports sensitive information before documents are shared with AI systems.

## Overview

Conseal exists because organizations increasingly share documents with LLMs, copilots, and external AI tools, but those documents often contain personally identifiable information, sensitive business information, and internal identifiers that should not be exposed blindly.

Blind redaction is risky. Pure automation can miss real sensitive data, over-redact harmless content, or hide important decisions from the reviewer. Conseal adds an interactive review layer on top of detection so users can:

- inspect detections
- correct mistakes
- export reviewed documents
- maintain an audit trail

The current implementation is a deployable MVP focused on review quality, explainability, and reliable fallback behavior.

## Features

### Trust Review

Trust Review helps a user inspect detected sensitive information before sharing a document with an AI tool.

- confidence scores for detected spans
- explanation panel for why content was flagged
- confidence threshold filtering
- why-not inspector for visible text
- accept and reject review decisions
- audit trail and reviewed export

### Correction Review

Correction Review is designed to catch missed PII and resolve false positives before export.

- missed PII warning banner
- two-lane correction queue
- manual span tagging for missed content
- heuristic validation and seeded correction-mode cues
- fast-review friction gate before export
- audit-backed corrected export

### Batch Review

Batch Review provides a lightweight queue for processing multiple text files.

- drag and drop upload
- local queue of files
- sequential per-file review
- throughput indicator
- keyboard shortcuts
- individual reviewed export per file

Current implementation uses frontend-driven batch processing rather than a backend batch queue.

### Export

- redacted document output
- `audit_log.csv`
- `manifest.json`
- ZIP bundle for handoff and review traceability

### Detector

- optional OpenAI-compatible LLM detector
- deterministic heuristic fallback detector
- automatic fallback when LLM fails or returns unusable output

### Privacy-Conscious MVP Design

- no authentication
- no database
- in-memory sessions only
- sensitive LLM keys remain backend-only

## Architecture

```text
                +------------------------------+
                |      Next.js Frontend        |
                | App Router + Shared Review   |
                | Engine + Zustand Stores      |
                +--------------+---------------+
                               |
                               | REST API
                               v
                +--------------+---------------+
                |        FastAPI Backend       |
                | Routers + Pydantic Models    |
                +--------------+---------------+
                               |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
  Detector Service       Session Store          Export Service
        |              In-memory, thread-safe   ZIP generator
        |
  +-----+------------------+
  |                        |
  v                        v
Mock Detector      Optional LLM Detector
Deterministic      OpenAI-compatible
Fallback           provider integration
```

### Frontend

The frontend lives in `frontend/` and is built with Next.js 14, TypeScript, Tailwind CSS, and Zustand.

- `frontend/src/app`
  - route-level pages for landing, trust, correction, and batch review
- `frontend/src/components/shared`
  - reusable review engine pieces such as the document viewer, span highlights, action bar, audit panel, and export button
- `frontend/src/components/trust`
  - explainability-focused UI for trust review
- `frontend/src/components/correction`
  - safety and correction workflow components
- `frontend/src/components/batch`
  - lightweight queue and upload workflow for batch review
- `frontend/src/store`
  - Zustand stores for review state and batch queue state

### Backend

The backend lives in `backend/` and is built with FastAPI, Pydantic, and a thread-safe in-memory session store.

- `backend/routers`
  - REST endpoints for analyze, decisions, export, and debug config
- `backend/services`
  - detector logic, redaction, export generation, and compatibility helpers
- `backend/models`
  - Pydantic contracts for documents, spans, sessions, and decisions
- `backend/store`
  - thread-safe in-memory session storage

### Detector Layer

The detector layer supports two modes:

- heuristic fallback detector for deterministic offline/demo behavior
- optional OpenAI-compatible detector for semantic extraction when configured

### Export

The export pipeline produces:

- redacted text output
- CSV audit log
- JSON manifest

## Project Structure

```text
conseal/
├── backend/
│   ├── config.py
│   ├── main.py
│   ├── models/
│   ├── routers/
│   ├── scripts/
│   ├── services/
│   └── store/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── store/
│   │   └── types/
│   └── package.json
├── README.md
├── WRITEUP.md
├── Build_Plan.md
└── Anantha_Ram_G_S___Resume.pdf
```

Important directories:

- `backend/services`
  - mock detector, optional LLM detector, redactor, exporter
- `backend/scripts`
  - diagnostics for mock detection, detector fallback, and NVIDIA/OpenAI-compatible connectivity
- `frontend/src/components`
  - shared review engine plus mode-specific flows
- `frontend/src/lib`
  - typed API client and span utilities

## Tech Stack

| Area | Tools |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand |
| UI Primitives | Radix UI |
| File Upload | React Dropzone |
| Keyboard Shortcuts | React Hotkeys Hook |
| Backend | FastAPI, Uvicorn |
| Validation | Pydantic |
| API Client | httpx |
| Config Loading | python-dotenv |
| Export | Python standard library `zipfile`, `csv`, `io` |
| Deployment | Vercel, Railway or Render |

## Detection Pipeline

```text
User submits document
        ↓
Detector service
        ↓
PII spans
        ↓
Interactive review
        ↓
Accept / Reject / Add
        ↓
Audit log
        ↓
Redaction
        ↓
ZIP export
```

## Detection Modes

### `USE_LLM=false`

Uses the deterministic heuristic detector directly.

### `USE_LLM=true`

Attempts OpenAI-compatible LLM detection.

If the LLM fails, times out, returns invalid JSON, or produces no valid spans, Conseal automatically falls back to the heuristic detector.

This guarantees reliable offline and demo behavior even when cloud detection is unavailable.

## Export Bundle

Each export ZIP contains:

- `redacted_<filename>.txt`
  - reviewed document with accepted or added spans replaced
- `audit_log.csv`
  - review actions with timestamps, span text, type, action, and confidence
- `manifest.json`
  - metadata including session id, filename, mode, reviewed span count, and export timestamp

## Installation

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

### Frontend

File: `frontend/.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Backend

File: `backend/.env`

```env
ALLOWED_ORIGINS=http://localhost:3000
USE_LLM=false
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
LLM_API_KEY=
LLM_TIMEOUT_SECONDS=30
```

NVIDIA example:

```env
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=<copy exact model id from NVIDIA Build>
LLM_API_KEY=<your NVIDIA API key>
```

Important notes:

- never commit real `.env` files
- `LLM_API_KEY` should stay in `backend/.env` only
- frontend env files must never contain LLM credentials

## Local Setup

Prerequisites:

- Node.js 18+
- Python 3.11+
- npm
- pip

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:8000/health`
- `http://localhost:8000/docs`

## Diagnostics

```bash
cd backend
python scripts/check_mock_detector.py
python scripts/check_llm.py
python scripts/test_nvidia_llm.py
```

- `check_mock_detector.py`
  - validates heuristic fallback behavior against representative business-document samples
- `check_llm.py`
  - validates detector path selection and LLM-to-fallback behavior
- `test_nvidia_llm.py`
  - validates raw NVIDIA or OpenAI-compatible connectivity without invoking the full detector

## API Overview

- `GET /health`
  - basic backend health check
- `GET /api/v1/debug/config`
  - masked runtime detector/config diagnostics for development
- `POST /api/v1/analyze`
  - analyzes a document and returns review spans
- `POST /api/v1/decisions`
  - records accept, reject, or add decisions for a span
- `GET /api/v1/export/{session_id}`
  - exports a reviewed session as a ZIP bundle

## Usage Flow

### Trust Review

1. Paste a document or use the sample text
2. Analyze the document
3. Click highlighted spans
4. Review the explanation panel
5. Accept or reject detections
6. Export a reviewed ZIP

### Correction Review

1. Analyze the document
2. Review the missed PII banner
3. Use the two-lane correction queue
4. Manually flag missed text if needed
5. Review and export

### Batch Review

1. Upload `.txt` files
2. Review the queue
3. Approve or reject files
4. Export reviewed files individually

## Detector Strategy

- `USE_LLM=true` attempts OpenAI-compatible LLM detection first
- if the LLM fails, Conseal falls back to the heuristic detector
- `USE_LLM=false` uses the heuristic detector directly
- the fallback detects names, emails, phones, SSNs, IDs, addresses, and DOB-like values when context is strong enough
- fallback detection is intentionally deterministic for demo reliability

## Intentional Scope Cuts

- no auth
  - this MVP is single-workflow and review-focused, not identity-focused
- no database
  - session-based in-memory state is enough for the prototype
- no PDF/DOCX parsing
  - the core judging target is review workflow quality, not file-format ingestion
- no backend batch queue
  - current batch mode is frontend-driven to stay lightweight and reliable
- no bulk batch ZIP
  - batch review supports individual reviewed exports only
- undo is local-only
  - UI undo exists, but backend audit reversal is not implemented
- LLM integration optional
  - the system remains usable even when cloud detection is unavailable

## Deployment Notes

### Frontend

- deploy `frontend/` to Vercel
- set `NEXT_PUBLIC_BACKEND_URL` to the deployed backend URL

### Backend

- deploy `backend/` to Railway or Render
- set `ALLOWED_ORIGINS` to the deployed frontend origin
- set `USE_LLM` and the `LLM_*` variables only if cloud detection is required
- use the start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Final Smoke Test

- backend `/health` works
- backend `/docs` works
- frontend build passes
- Trust Review analyze/accept/export works
- Correction Review manual add/export works
- Batch Review upload/review works
- export ZIP contains redacted text, `audit_log.csv`, and `manifest.json`

## Submission Materials

This repository includes:

- `WRITEUP.md`
- `Build_Plan.md`
- `Anantha_Ram_G_S___Resume.pdf`

Recommended demo video flow:

1. Trust Review
2. Correction Review
3. Batch Review
4. Export ZIP
