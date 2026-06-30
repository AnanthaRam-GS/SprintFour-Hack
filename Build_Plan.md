# Conseal Hackathon — Complete Build Plan
### Sprintfour Hackathon | Unified PII Anonymization System
### Covering: Problem 1 (Trust), Problem 2 (Batch), Problem 3 (Correction)

---

## Table of Contents

1. [Hackathon Overview](#1-hackathon-overview)
2. [Strategic Decision](#2-strategic-decision)
3. [Problem Statements Summary](#3-problem-statements-summary)
4. [System Architecture](#4-system-architecture)
5. [Finalized Tech Stack](#5-finalized-tech-stack)
6. [LLM Strategy — Free Models](#6-llm-strategy--free-models)
7. [Complete File Structure](#7-complete-file-structure)
8. [Core Data Models](#8-core-data-models)
9. [API Contract](#9-api-contract)
10. [Feature Map by Mode](#10-feature-map-by-mode)
11. [System User Flow](#11-system-user-flow)
12. [Phased Build Plan — 8 Hours](#12-phased-build-plan--8-hours)
13. [Component Specifications](#13-component-specifications)
14. [Shared Engine Implementation Notes](#14-shared-engine-implementation-notes)
15. [Deliberate Scope Cuts (Writeup Material)](#15-deliberate-scope-cuts-writeup-material)
16. [Deployment Checklist](#16-deployment-checklist)
17. [Submission Checklist](#17-submission-checklist)

---

## 1. Hackathon Overview

**Company:** Sprintfour
**Product:** Conseal — a desktop PII anonymization tool
**Format:** Solo, 8-hour build day + extended submission until end of week
**Goal:** Build a full-stack application solving one (or more) of three real problems Conseal must solve

**What judges score (in order of importance):**
- Software engineering fundamentals — clean, structured, readable code
- Discovery — did you find the hard edge cases not written in the prompt?
- Judgment — did you spend effort on what actually matters?
- Real-user empathy — did you design for the actual person, not a clean demo?
- Tradeoff awareness — did you recognize tensions and make deliberate calls?
- Reasoning — can you explain your choices including what you left out?

**Key constraint:** Working code is the floor, not the differentiator. AI tools are expected — judgment on top of them is what wins.

**PII Detection:** No need to build from scratch. Use either:
- **Option A:** Cloud/free LLM returning span JSON (recommended)
- **Option B:** Mock backend with fixed PII spans (fastest to start)

---

## 2. Strategic Decision

### Decision: Build all three problems as one unified system

**Rationale:**
- Problems 1 and 3 share ~80% of their core infrastructure (span renderer, action handler, audit logger)
- All three problems share the same backend API and data model
- Building a unified system with three modes demonstrates superior architecture thinking
- The writeup can explicitly call out this unification as a deliberate design decision
- Three modes > one mode when the shared foundation is built correctly

**Build order:** Shared core → Problem 1 → Problem 3 → Problem 2
- If time runs out after P1 + P3: still a strong two-problem submission
- If all three complete: strongest possible submission in the competition

**Risk mitigation:** Problem 2 (batch) is the highest unique effort. It is built last so P1 and P3 are always complete before the deadline.

---

## 3. Problem Statements Summary

### Problem 1 — Trust & Explainability (Marcus)
**User:** Marcus — anxious professional who has been burned by opaque redaction tools before
**Core need:** He wants to know WHY every span was hidden AND why every visible piece of text was kept
**Real anxiety:** "Redacted" documents where data was still present underneath
**Success state:** Marcus goes from anxious → confident by the end of one review session
**Key insight:** This is a trust design problem, not a UI problem

### Problem 2 — Working at Volume (Maya)
**User:** Maya — paralegal with 200 case files to anonymize before end of day
**Core need:** She processes documents one at a time right now. She needs batch throughput
**Real constraint:** She will abandon any tool the moment it slows her down
**Success state:** Maya processes 200 files before her deadline with an auditable output
**Key insight:** Speed and friction-reduction ARE the product for this user

### Problem 3 — Fixing the Tool's Mistakes (Sam)
**User:** Sam — fast-moving reviewer who trusts the tool a little too much
**Core problem:** The tool has false positives (harmless text hidden) AND missed PII (sensitive text left visible)
**Real danger:** Sam's confirmation bias — he doesn't stop to look at what he doesn't expect to be wrong
**Success state:** The interface protects Sam from his own imperfect attention
**Key insight:** This is a behavioral design problem — design against human confirmation bias

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Trust Mode  │  │ Batch Mode  │  │   Correction Mode        │  │
│  │ (Problem 1) │  │ (Problem 2) │  │   (Problem 3)            │  │
│  │  Marcus     │  │  Maya       │  │   Sam                    │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│  ┌──────▼──────────────────────────────────────▼─────────────┐  │
│  │              SHARED DOCUMENT REVIEW ENGINE                  │  │
│  │   SpanRenderer │ ActionHandler │ AuditLogger │ ExportTrigger│  │
│  └──────────────────────────────┬──────────────────────────── ┘  │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ REST API
┌─────────────────────────────────▼───────────────────────────────┐
│                    BACKEND (FastAPI / Python)                     │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ PII Detector │ │Session Store│ │  Batch   │ │   Export    │  │
│  │(LLM or mock) │ │ (in-memory) │ │  Queue   │ │   Engine    │  │
│  └──────┬───────┘ └─────────────┘ └──────────┘ └─────────────┘  │
│         │                                                         │
│  ┌──────▼───────────────────────────────────────────────────┐    │
│  │  LLM Service (feature-flagged)                            │    │
│  │  USE_LLM=false → mock_detector.py (fixed spans)           │    │
│  │  USE_LLM=true  → llm_detector.py (Deepseek/Gemini/etc)   │    │
│  └───────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles
- **One backend, three modes:** All three frontend modes consume the same REST API
- **Shared core built once:** SpanRenderer, ActionHandler, AuditLogger are shared React components
- **Feature-flagged LLM:** `USE_LLM` env var toggles real detection vs mock — zero code change
- **Session-based state:** In-memory Python dict keyed by `session_id` — no database needed for MVP
- **Separation of concerns:** Models → Services → Routers on backend; Types → Store → Components on frontend

---

## 5. Finalized Tech Stack

### Frontend

| Technology | Version | Purpose | Why |
|---|---|---|---|
| Next.js | 14 (App Router) | Framework | Three routes map to three modes; client components throughout |
| TypeScript | 5.x | Language | Shared types enforced across all modes; catches model-mismatch bugs |
| Tailwind CSS | 3.x | Styling | Zero context-switching; rapid layout during time pressure |
| Zustand | 4.x | Global state | Span + document state shared across mode panels; lighter than Redux |
| @radix-ui/react | latest | UI primitives | Popover (confidence tooltip), Dialog (friction gate), Toast — accessible by default |
| react-dropzone | latest | File upload (P2) | One hook handles drag state, validation, multi-file — replaces 200 lines |
| react-hotkeys-hook | latest | Keyboard nav (P2) | Single-line shortcut registration; scoped to components |
| SWR | 2.x | Data fetching (P2) | Interval polling for batch queue; `refreshInterval=1500` gives live updates |

### Backend

| Technology | Version | Purpose | Why |
|---|---|---|---|
| FastAPI | 0.110+ | API framework | Async by default; auto OpenAPI docs; Pydantic integration |
| Python | 3.11+ | Language | Strong stdlib (csv, zipfile, json) — zero extra installs for export |
| Pydantic | v2 | Data validation | Single source of truth for Span/Document models mirrored in TypeScript |
| FastAPI BackgroundTasks | built-in | Async queue (P2) | Per-file background processing without Redis or Celery |
| python-multipart | latest | File upload (P2) | Enables multipart/form-data for batch file upload endpoint |
| httpx | latest | LLM HTTP calls | Async HTTP client for LLM API calls |
| uvicorn | latest | ASGI server | Runs FastAPI in production |

### Deployment

| Service | Purpose | Why |
|---|---|---|
| Vercel | Frontend hosting | Zero-config Next.js; free tier; one git push = live URL |
| Railway | Backend hosting | Free tier; Python/Dockerfile support; HTTPS URL in minutes |

---

## 6. LLM Strategy — Free Models

### Recommended: Deepseek V3 via OpenRouter

**Why Deepseek V3:**
- Free tier with generous limits (enough for a hackathon)
- OpenAI-compatible API — same SDK, just change base URL and model string
- Excellent instruction following for structured JSON output
- No credit card required for free tier

**Why OpenRouter as the gateway:**
- Aggregates Deepseek, Gemini Flash, Llama 3.1, Mistral and more
- Single API key, swap models in one line
- Automatic fallback routing available

### Fallback: Google Gemini 1.5 Flash
- Free via Google AI Studio
- Very fast inference
- Good structured output support

### Environment Configuration

```env
# .env (never commit this)
USE_LLM=true
LLM_PROVIDER=openrouter          # or: gemini, anthropic
OPENROUTER_API_KEY=sk-or-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...     # optional, only if using Claude
LLM_MODEL=deepseek/deepseek-chat # or: google/gemini-flash-1.5
BACKEND_URL=http://localhost:8000
```

### PII Detection Prompt (used by llm_detector.py)

```
You are a PII detection engine. Analyze the following document text and identify all personally identifiable information.

Return ONLY a JSON array with no other text, markdown, or explanation:
[
  {
    "start": <integer char offset>,
    "end": <integer char offset>,
    "text": "<exact matched text>",
    "type": "<NAME|EMAIL|PHONE|SSN|ADDRESS|DATE_OF_BIRTH|ID_NUMBER|CREDIT_CARD|OTHER>",
    "confidence": <float 0.0-1.0>,
    "explanation": "<one sentence explaining why this is PII>",
    "pattern_matched": "<describe the pattern or rule that triggered this>"
  }
]

If no PII is found, return an empty array: []

Document:
{document_text}
```

### Feature Flag Implementation (pii_detector.py)

```python
import os
from services.mock_detector import detect_mock
from services.llm_detector import detect_llm

async def detect_pii(text: str, mode: str) -> list[dict]:
    if os.getenv("USE_LLM", "false").lower() == "true":
        return await detect_llm(text, mode)
    return detect_mock(text, mode)
```

---

## 7. Complete File Structure

```
conseal-hackathon/
├── .env.example                          # Template: OPENROUTER_API_KEY, USE_LLM, etc.
├── .gitignore                            # node_modules, .env, __pycache__, .next
├── docker-compose.yml                    # Runs frontend + backend together locally
├── README.md                             # Setup instructions (required by submission)
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   │
│   └── src/
│       ├── types/                        # Shared TypeScript interfaces
│       │   ├── span.ts                   # Span, SpanType, SpanDecision, SpanAction
│       │   ├── document.ts               # Document, ProcessedDocument, AnalysisResult
│       │   └── session.ts                # Session, AuditEntry, BatchJob, BatchStatus
│       │
│       ├── store/                        # Zustand global state
│       │   ├── documentStore.ts          # Active document, spans, decisions, threshold
│       │   ├── batchStore.ts             # Queue of BatchJob items (Problem 2)
│       │   └── auditStore.ts             # Append-only audit log (all modes)
│       │
│       ├── lib/                          # Utility functions
│       │   ├── api.ts                    # Typed fetch wrappers for all backend endpoints
│       │   ├── spanUtils.ts              # getSelection→span, char offset mapping
│       │   └── exportUtils.ts            # Trigger ZIP download from backend
│       │
│       ├── components/
│       │   ├── shared/                   # Used by all three modes
│       │   │   ├── DocumentViewer.tsx    # Renders doc text with inline span highlights
│       │   │   ├── SpanHighlight.tsx     # Single highlighted span, color-coded by type
│       │   │   ├── ActionBar.tsx         # Accept / Reject / Undo buttons
│       │   │   ├── AuditPanel.tsx        # Collapsible audit log sidebar
│       │   │   ├── ConfidenceBadge.tsx   # Visual confidence score pill (color by value)
│       │   │   ├── ExportButton.tsx      # Triggers redacted doc + CSV download
│       │   │   └── ModeNav.tsx           # Top nav linking all three modes with persona
│       │   │
│       │   ├── trust/                    # Problem 1 — Marcus
│       │   │   ├── TrustLayout.tsx       # Two-column: doc viewer + explanation panel
│       │   │   ├── ExplanationPanel.tsx  # Why-redacted detail for active/clicked span
│       │   │   ├── WhyNotInspector.tsx   # Radix Popover on visible text mouseup
│       │   │   ├── AuditSummaryHeader.tsx# PII counts by type + below-threshold notice
│       │   │   └── ThresholdSlider.tsx   # Confidence cutoff slider, filters spans live
│       │   │
│       │   ├── batch/                    # Problem 2 — Maya
│       │   │   ├── BatchLayout.tsx       # Split: queue panel left, doc review right
│       │   │   ├── DropZone.tsx          # react-dropzone wrapper, multi-file
│       │   │   ├── QueuePanel.tsx        # List of BatchJob items with status badges
│       │   │   ├── QueueItem.tsx         # Single file row: name, status, action button
│       │   │   ├── BatchReviewPane.tsx   # DocumentViewer for current queue file
│       │   │   ├── KeyboardShortcutBar.tsx# Persistent shortcut legend at bottom
│       │   │   ├── ThroughputBadge.tsx   # Files/hr counter + deadline ETA
│       │   │   └── BulkExportButton.tsx  # Downloads ZIP of all approved files
│       │   │
│       │   └── correction/               # Problem 3 — Sam
│       │       ├── CorrectionLayout.tsx  # Doc viewer + two-lane review sidebar
│       │       ├── MissedPIIBanner.tsx   # Alert header with scroll-to-location links
│       │       ├── TwoLaneQueue.tsx      # Lane 1: false positives | Lane 2: missed PII
│       │       ├── FrictionGate.tsx      # Radix Dialog on fast-approve detection
│       │       ├── ManualSpanSelector.tsx# Text selection → tag as PII type
│       │       └── UndoStack.tsx         # Undo/redo bar for all corrections
│       │
│       └── app/                          # Next.js App Router pages
│           ├── layout.tsx                # Root layout: ModeNav, Toaster provider
│           ├── page.tsx                  # Landing: mode selector (which persona?)
│           ├── trust/
│           │   └── page.tsx              # Problem 1 — Marcus view
│           ├── batch/
│           │   └── page.tsx              # Problem 2 — Maya view
│           └── correction/
│               └── page.tsx              # Problem 3 — Sam view
│
└── backend/
    ├── main.py                           # FastAPI app entry, CORS, router registration
    ├── requirements.txt                  # All Python dependencies
    ├── Dockerfile                        # For Railway deployment
    ├── .env.example                      # Backend env var template
    │
    ├── models/                           # Pydantic data models
    │   ├── span.py                       # Span, SpanType, SpanDecision, SpanAction
    │   ├── document.py                   # Document, AnalysisResult, AnalysisRequest
    │   └── session.py                    # Session, AuditEntry, BatchJob, BatchStatus
    │
    ├── routers/                          # FastAPI route handlers
    │   ├── analyze.py                    # POST /analyze — single doc PII detection
    │   ├── decisions.py                  # POST /decisions — record span decision
    │   ├── batch.py                      # POST /batch/upload, GET /batch/status/{id}
    │   └── export.py                     # GET /export/{session_id} — ZIP + CSV stream
    │
    ├── services/                         # Business logic
    │   ├── pii_detector.py               # Feature-flagged router: mock or LLM
    │   ├── mock_detector.py              # Returns fixed realistic spans for sample docs
    │   ├── llm_detector.py               # OpenRouter/Gemini call, parses JSON response
    │   ├── redactor.py                   # Replaces approved spans → [REDACTED-TYPE]
    │   └── exporter.py                   # Builds ZIP: redacted docs + audit.csv
    │
    └── store/
        └── session_store.py              # In-memory dict: session_id → Session object
```

---

## 8. Core Data Models

### TypeScript (frontend/src/types/)

```typescript
// span.ts
export type SpanType =
  | 'NAME' | 'EMAIL' | 'PHONE' | 'SSN' | 'ADDRESS'
  | 'DATE_OF_BIRTH' | 'ID_NUMBER' | 'CREDIT_CARD' | 'OTHER';

export type SpanAction = 'accept' | 'reject' | 'add';

export interface Span {
  id: string;
  start: number;               // char offset in document text
  end: number;                 // char offset in document text
  text: string;                // exact matched text
  type: SpanType;
  confidence: number;          // 0.0 – 1.0
  explanation: string;         // plain-language why this is PII
  pattern_matched: string;     // what rule/pattern triggered detection
  is_suggested: boolean;       // true = tool suggested; false = user added
  potentially_missed: boolean; // true = visible text that might be PII (Problem 3)
  decision?: SpanAction;       // set after user acts
}

// document.ts
export interface Document {
  id: string;
  filename: string;
  text: string;
  uploaded_at: string;
}

export interface AnalysisResult {
  session_id: string;
  document: Document;
  spans: Span[];
  mode: 'trust' | 'batch' | 'correction';
}

// session.ts
export interface AuditEntry {
  timestamp: string;
  span_id: string;
  span_text: string;
  span_type: SpanType;
  action: SpanAction;
  confidence: number;
}

export interface BatchJob {
  job_id: string;
  filename: string;
  status: 'queued' | 'processing' | 'needs_review' | 'approved' | 'rejected';
  session_id?: string;         // set once processing completes
  span_count?: number;
  processed_at?: string;
}
```

### Python Pydantic (backend/models/)

```python
# span.py
from pydantic import BaseModel
from enum import Enum
from typing import Optional

class SpanType(str, Enum):
    NAME = "NAME"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    SSN = "SSN"
    ADDRESS = "ADDRESS"
    DATE_OF_BIRTH = "DATE_OF_BIRTH"
    ID_NUMBER = "ID_NUMBER"
    CREDIT_CARD = "CREDIT_CARD"
    OTHER = "OTHER"

class SpanAction(str, Enum):
    ACCEPT = "accept"
    REJECT = "reject"
    ADD = "add"

class Span(BaseModel):
    id: str
    start: int
    end: int
    text: str
    type: SpanType
    confidence: float
    explanation: str
    pattern_matched: str
    is_suggested: bool = True
    potentially_missed: bool = False
    decision: Optional[SpanAction] = None

# document.py
class AnalysisRequest(BaseModel):
    text: str
    filename: str
    mode: str  # "trust" | "batch" | "correction"

class AnalysisResult(BaseModel):
    session_id: str
    filename: str
    spans: list[Span]
    mode: str

# session.py
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
    new_span: Optional[Span] = None  # for action="add"
```

---

## 9. API Contract

All endpoints are prefixed with `/api/v1`. Frontend uses `lib/api.ts` typed wrappers for all calls.

### POST /api/v1/analyze
Submit a document for PII detection (single file, all modes).

```
Request:
  Content-Type: application/json
  Body: { text: string, filename: string, mode: "trust"|"batch"|"correction" }

Response 200:
  {
    session_id: string,       // UUID, used for all subsequent calls
    filename: string,
    mode: string,
    spans: Span[]             // see Span model above
  }
```

### POST /api/v1/decisions
Record a user's accept/reject/add decision on a span.

```
Request:
  Content-Type: application/json
  Body: {
    session_id: string,
    span_id: string,
    action: "accept" | "reject" | "add",
    new_span?: Span           // required when action="add"
  }

Response 200:
  {
    ok: true,
    audit_entry: AuditEntry
  }
```

### POST /api/v1/batch/upload
Upload multiple files for batch processing (Problem 2).

```
Request:
  Content-Type: multipart/form-data
  Body: files[] (multiple files)

Response 200:
  {
    batch_id: string,
    jobs: BatchJob[]          // one per uploaded file, status="queued"
  }
```

### GET /api/v1/batch/status/{batch_id}
Poll for batch processing progress (called by SWR every 1500ms).

```
Response 200:
  {
    batch_id: string,
    total: number,
    done: number,
    processing: number,
    queued: number,
    jobs: BatchJob[]
  }
```

### GET /api/v1/export/{session_id}
Export redacted document and audit log as a ZIP download.

```
Response 200:
  Content-Type: application/zip
  Content-Disposition: attachment; filename="conseal_export_{session_id}.zip"

  ZIP contents:
  ├── redacted_{filename}.txt     # document with approved spans replaced by [REDACTED-TYPE]
  └── audit_log.csv               # all decisions: timestamp, span_text, type, action, confidence
```

### GET /api/v1/export/batch/{batch_id}
Export all approved files from a batch session as a ZIP (Problem 2).

```
Response 200:
  Content-Type: application/zip

  ZIP contents:
  ├── redacted_file1.txt
  ├── redacted_file2.txt
  ├── ... (one per approved file)
  └── audit_log.csv               # combined audit log across all files
```

---

## 10. Feature Map by Mode

### Problem 1 — Trust Mode (Marcus)

| Feature | Component | Notes |
|---|---|---|
| Document viewer with span highlights | DocumentViewer + SpanHighlight | Shared component |
| Click span → explanation panel | ExplanationPanel | Type, confidence bar, pattern, plain-language why |
| Hover visible text → why-not popover | WhyNotInspector | window.getSelection() + Radix Popover |
| Confidence threshold slider | ThresholdSlider | Filters spans client-side, no API call |
| Audit summary header | AuditSummaryHeader | Counts by PII type + below-threshold notice |
| Accept / reject / undo | ActionBar | Shared component |
| Audit log panel | AuditPanel | Shared component |
| Export redacted doc + audit CSV | ExportButton | Shared component |

### Problem 2 — Batch Mode (Maya)

| Feature | Component | Notes |
|---|---|---|
| Drag-and-drop multi-file upload | DropZone | react-dropzone, up to 200 files |
| Live processing queue | QueuePanel + QueueItem | SWR polling every 1500ms |
| Per-file review (reuses shared engine) | BatchReviewPane | DocumentViewer for active file |
| Keyboard shortcuts | KeyboardShortcutBar | Space=approve, ←→=navigate, R=reject span |
| Auto-approve high-confidence files | QueuePanel logic | Files where all spans ≥ 0.9 skip review |
| Throughput counter | ThroughputBadge | Files/hr + ETA to completion |
| Bulk ZIP export + audit CSV | BulkExportButton | All approved files in one download |

### Problem 3 — Correction Mode (Sam)

| Feature | Component | Notes |
|---|---|---|
| Missed PII alert banner | MissedPIIBanner | Shown before review, must be acknowledged |
| Two-lane review queue | TwoLaneQueue | Lane 1: false positives (amber) \| Lane 2: missed PII (red) |
| Friction gate on fast-approve | FrictionGate | Triggers if full review < 8 seconds with low-confidence spans |
| Manual span selection + tagging | ManualSpanSelector | window.getSelection() → PII type dropdown → new span |
| Undo/redo stack | UndoStack | Every correction is reversible |
| Pre-export diff view | CorrectionLayout | Shows original vs corrected before download |
| Accept / reject / undo | ActionBar | Shared component |
| Export corrected doc | ExportButton | Shared component, includes correction diff in audit |

---

## 11. System User Flow

```
[Landing Page]
     │
     ├──────────────────┬─────────────────────┤
     ▼                  ▼                     ▼
[Trust Mode]      [Batch Mode]        [Correction Mode]
  Marcus             Maya                  Sam
     │                  │                     │
[Paste/upload      [Drag-drop           [Load pre-analyzed
 single doc]        1-200 files]         doc with spans]
     │                  │                     │
     └──────────────────┴─────────────────────┘
                        │
              [POST /api/v1/analyze]
              [or /batch/upload]
                        │
           ┌────────────▼────────────┐
           │  PII Detector Service    │
           │  (mock or LLM)           │
           │  Returns: Span[]         │
           └────────────┬────────────┘
                        │
     ┌──────────────────┴─────────────────────┐
     ▼                  ▼                     ▼
[Audit summary     [Queue panel          [Missed PII
 + threshold        populates             banner shown
 slider shown]      with status]          (must dismiss)]
     │                  │                     │
[Click span →      [Keyboard nav         [Two-lane queue:
 explanation        through files]        FP | Missed PII]
 panel opens]          │                     │
     │             [Space = approve      [Manual selection
[Visible text →     file, advance         to add missed
 why-not popup]     queue]                PII spans]
     │                  │                     │
[Threshold         [Auto-approve          [Fast-approve →
 slider re-         high-confidence        friction gate
 filters spans]     files]                 modal]
     │                  │                     │
     └──────────────────┴─────────────────────┘
                        │
              [POST /api/v1/decisions]
              [Audit log updated]
                        │
              [GET /api/v1/export/{id}]
                        │
              [ZIP: redacted doc + audit.csv]
                        │
              [Safe to share with AI tools ✓]
```

---

## 12. Phased Build Plan — 8 Hours

### Phase 0 — Scaffold & Foundation (0:00 – 0:45)
**Goal:** Both servers running, talking to each other, returning mock data

Tasks:
- [ ] `npx create-next-app@latest frontend --typescript --tailwind --app`
- [ ] Install frontend deps: `zustand @radix-ui/react-popover @radix-ui/react-dialog react-dropzone react-hotkeys-hook swr`
- [ ] Create `backend/` with `main.py`, `requirements.txt`, `Dockerfile`
- [ ] Install backend deps: `fastapi uvicorn pydantic python-multipart httpx python-dotenv`
- [ ] Define shared types: `frontend/src/types/span.ts`, `document.ts`, `session.ts`
- [ ] Define Pydantic models: `backend/models/span.py`, `document.py`, `session.py`
- [ ] Implement `mock_detector.py` with 5–8 realistic sample spans (include one `potentially_missed`)
- [ ] Implement `session_store.py` (Python dict, thread-safe with `threading.Lock`)
- [ ] Implement `POST /api/v1/analyze` returning mock spans + session_id
- [ ] Configure CORS in `main.py` for localhost:3000
- [ ] Create `lib/api.ts` with typed fetch wrappers
- [ ] **Checkpoint:** `curl POST /api/v1/analyze` returns span JSON ✓

### Phase 1 — Shared Document Review Engine (0:45 – 2:00)
**Goal:** DocumentViewer renders text with highlights; decisions recorded to audit log

Tasks:
- [ ] Build `DocumentViewer.tsx` — splits document text at span boundaries into text/highlight nodes
- [ ] Build `SpanHighlight.tsx` — inline highlight with color per SpanType, onClick handler
- [ ] Build `ConfidenceBadge.tsx` — color-coded pill: green ≥0.8, amber 0.5–0.8, red <0.5
- [ ] Build `ActionBar.tsx` — Accept / Reject / Undo with keyboard hints
- [ ] Build `AuditPanel.tsx` — scrollable log of AuditEntry items
- [ ] Build `ExportButton.tsx` — calls `GET /export/{session_id}`, triggers browser download
- [ ] Build `ModeNav.tsx` — top nav: Trust | Batch | Correction with persona subtitle
- [ ] Implement `POST /api/v1/decisions` — appends AuditEntry to session store
- [ ] Implement `GET /api/v1/export/{session_id}` — calls `redactor.py` + `exporter.py`
- [ ] Implement `redactor.py` — char-offset replacement of accepted spans in document text
- [ ] Implement `exporter.py` — builds ZIP with redacted doc + audit.csv using stdlib only
- [ ] Set up Zustand `documentStore` — holds spans, decisions, active span
- [ ] **Checkpoint:** Paste text → spans highlight → click span → accept → audit log updates → export ZIP ✓

### Phase 2 — Trust Mode (2:00 – 3:30)
**Goal:** Problem 1 complete; Marcus can go from anxious to confident

Tasks:
- [ ] Build `TrustLayout.tsx` — two-column: 60% doc viewer, 40% explanation panel
- [ ] Build `ExplanationPanel.tsx` — shows for active span: type badge, confidence bar (visual %), explanation text, pattern_matched, "why this was flagged" in plain language
- [ ] Build `WhyNotInspector.tsx` — `mouseup` on non-highlighted text → `window.getSelection()` → map to char offsets → check if overlaps any low-confidence span → Radix Popover with explanation ("This text was kept visible because...")
- [ ] Build `ThresholdSlider.tsx` — range 0–100, updates Zustand `threshold`, DocumentViewer filters spans where `confidence < threshold` to show as "below threshold" style
- [ ] Build `AuditSummaryHeader.tsx` — derived from spans: total found, breakdown by type, count below current threshold
- [ ] Wire `/trust/page.tsx` — calls POST /analyze on doc submit, renders TrustLayout
- [ ] **Checkpoint:** Full Marcus flow works end-to-end ✓

### Phase 3 — Correction Mode (3:30 – 5:00)
**Goal:** Problem 3 complete; Sam is protected from his own confirmation bias

Tasks:
- [ ] Build `MissedPIIBanner.tsx` — on load, show count of `potentially_missed` spans; each has scroll-to link; user must click "I understand, proceed" to dismiss
- [ ] Build `TwoLaneQueue.tsx` — sidebar with two sections:
  - Lane 1 (amber): spans where `is_suggested=true` AND `confidence < 0.65` (false positive candidates)
  - Lane 2 (red): spans where `potentially_missed=true` (missed PII candidates)
  - Each lane item shows text, type, confidence, Accept/Reject buttons
- [ ] Build `FrictionGate.tsx` — track `firstActionTimestamp` on first user action; on final submit, if `(submitTime - firstActionTime) < 8000ms` AND any span with `confidence < 0.7` is pending → show Radix Dialog listing the pending low-confidence spans, require explicit confirm
- [ ] Build `ManualSpanSelector.tsx` — on `mouseup` over non-highlighted text, show inline toolbar: "Flag as PII" with SpanType dropdown → creates new Span with `is_suggested=false`, sends `POST /decisions` with `action="add"`
- [ ] Build `UndoStack.tsx` — bottom bar showing last 3 actions with undo buttons; Zustand stores action history
- [ ] Wire `/correction/page.tsx` — calls POST /analyze on doc submit with `mode="correction"`, renders CorrectionLayout
- [ ] Update mock_detector.py — ensure correction mode returns: 2 false positives (low confidence), 1–2 `potentially_missed` spans
- [ ] **Checkpoint:** Full Sam flow works — banner, two lanes, friction gate, manual add, undo ✓

### Phase 4 — Batch Mode (5:00 – 7:00)
**Goal:** Problem 2 complete; Maya can process 200 files before deadline

Tasks:
- [ ] Build `DropZone.tsx` — react-dropzone wrapping, accepts .txt/.pdf/.docx (text only for MVP), shows file count and names before upload
- [ ] Build `QueuePanel.tsx` — left panel listing all BatchJob items with status badge per file
- [ ] Build `QueueItem.tsx` — file row: icon, name, status badge (queued/processing/needs-review/done), action button per status
- [ ] Build `BatchReviewPane.tsx` — right panel: renders DocumentViewer for the currently selected queue item; uses shared ActionBar
- [ ] Build `KeyboardShortcutBar.tsx` — persistent bottom bar showing: Space=approve, ↑↓=navigate queue, R=reject active span, E=export all done
- [ ] Build `ThroughputBadge.tsx` — top right: "43 files/hr · ETA 2h 14m" (computed from started_at + done count)
- [ ] Build `BulkExportButton.tsx` — calls `GET /api/v1/export/batch/{batch_id}`, triggers ZIP download
- [ ] Implement `POST /api/v1/batch/upload` — accepts multipart, creates BatchJob per file, queues BackgroundTasks
- [ ] Implement background task — calls `detect_pii()` per file, stores result in session_store, updates job status
- [ ] Implement `GET /api/v1/batch/status/{batch_id}` — returns BatchJob list with counts
- [ ] Implement `GET /api/v1/export/batch/{batch_id}` — ZIP of all approved files + combined audit.csv
- [ ] Set up SWR in QueuePanel: `useSWR('/api/v1/batch/status/{id}', { refreshInterval: 1500 })`
- [ ] Add react-hotkeys-hook: Space→approve current file, ArrowDown→next file, ArrowUp→prev file
- [ ] Auto-approve logic: if all spans in file have `confidence ≥ 0.9`, mark `status="approved"` without requiring manual review
- [ ] **Checkpoint:** Drop 5 files → queue fills → SWR updates status → keyboard through review → export ZIP ✓

### Phase 5 — Polish & Submission (7:00 – 8:00)
**Goal:** Shippable, submittable product

Tasks:
- [ ] Add error boundaries around all async components
- [ ] Add loading states: skeleton for DocumentViewer while analyzing, spinner in QueueItem while processing
- [ ] Add empty states: landing page mode selector with clear persona descriptions
- [ ] Ensure ModeNav works across all three routes
- [ ] Write `README.md`: prerequisites, install steps, `.env` setup, `npm run dev` + `uvicorn` commands
- [ ] Write submission writeup (~half page) — see Section 15 for scope cut talking points
- [ ] Record demo video — walk through all three modes in order: Trust → Correction → Batch
- [ ] Add resume to GitHub repo root
- [ ] Deploy frontend to Vercel: `npx vercel --prod`
- [ ] Deploy backend to Railway: push Dockerfile, add env vars in Railway dashboard
- [ ] Update README with live deployment URLs
- [ ] **Checkpoint:** Submission checklist complete ✓

---

## 13. Component Specifications

### DocumentViewer.tsx — Most Critical Component

This is the hardest shared component to build correctly. A document is plain text. PII spans are defined by character start/end offsets. To render highlights inline, the text must be split at span boundaries into interleaved segments: `[text, highlight, text, highlight, text, ...]`

```typescript
// Algorithm: split text into segments
function buildSegments(text: string, spans: Span[]): Segment[] {
  // 1. Sort spans by start offset
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;

  for (const span of sorted) {
    // Text before this span
    if (cursor < span.start) {
      segments.push({ type: 'text', text: text.slice(cursor, span.start) });
    }
    // The span itself
    segments.push({ type: 'span', span, text: text.slice(span.start, span.end) });
    cursor = span.end;
  }

  // Remaining text after last span
  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) });
  }
  return segments;
}
```

**Important:** Handle overlapping spans gracefully (skip the inner one). Handle spans outside text bounds (clamp). Both are real edge cases with LLM detection.

### WhyNotInspector.tsx — Text Selection Flow

```typescript
// On mouseup anywhere in DocumentViewer:
const handleMouseUp = () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  // Map DOM range to char offsets using a data-offset attribute on each text node
  const start = getCharOffset(range.startContainer, range.startOffset);
  const end = getCharOffset(range.endContainer, range.endOffset);

  // Check if selection overlaps any known span
  const overlappingSpan = spans.find(s => s.start <= end && s.end >= start);

  if (overlappingSpan) {
    // Already highlighted — show explanation of why it was flagged
    setWhyNotContent({ type: 'flagged', span: overlappingSpan });
  } else {
    // Visible text — explain why it was NOT flagged
    setWhyNotContent({ type: 'kept', text: selection.toString(), start, end });
  }
  setPopoverAnchor(/* position from range.getBoundingClientRect() */);
};
```

### FrictionGate.tsx — Timing Logic

```typescript
const firstActionRef = useRef<number | null>(null);

const handleFirstAction = () => {
  if (!firstActionRef.current) {
    firstActionRef.current = Date.now();
  }
};

const handleSubmit = () => {
  const elapsed = Date.now() - (firstActionRef.current ?? Date.now());
  const lowConfidenceSpans = spans.filter(s => s.confidence < 0.7 && !s.decision);
  const reviewedTooFast = elapsed < 8000 && lowConfidenceSpans.length > 0;

  if (reviewedTooFast) {
    setShowFrictionGate(true); // Show Radix Dialog
  } else {
    proceedToExport();
  }
};
```

### Mock Detector — Realistic Sample Data

The mock must be realistic enough to exercise all UI features. For each mode, return:

**Trust mode mock spans:**
- `{ type: "NAME", text: "Dr. Sarah Chen", confidence: 0.97, explanation: "Full name with professional title" }`
- `{ type: "EMAIL", text: "s.chen@hospital.org", confidence: 0.99, explanation: "Standard email format" }`
- `{ type: "PHONE", text: "(415) 555-0194", confidence: 0.95, explanation: "US phone number format" }`
- `{ type: "SSN", text: "482-73-1920", confidence: 0.88, explanation: "US Social Security Number pattern XXX-XX-XXXX" }`
- `{ type: "NAME", text: "Stanford", confidence: 0.41, explanation: "May be a person name or institution" }` ← below threshold

**Correction mode mock spans** (must include false positives AND missed PII):
- `{ type: "NAME", text: "Patient Zero", confidence: 0.72, explanation: "Detected as name" }` ← false positive (medical term)
- `{ type: "DATE_OF_BIRTH", text: "December 14", confidence: 0.61 }` ← false positive (event date, not DOB)
- `{ potentially_missed: true, text: "555-0147", explanation: "Possible phone number not flagged at primary pass" }`
- `{ potentially_missed: true, text: "James Whitfield", explanation: "Name pattern detected in secondary scan" }`

---

## 14. Shared Engine Implementation Notes

### Session Store (Python)

```python
# backend/store/session_store.py
import threading
from models.session import Session

_store: dict[str, Session] = {}
_lock = threading.Lock()

def get_session(session_id: str) -> Session | None:
    with _lock:
        return _store.get(session_id)

def set_session(session_id: str, session: Session) -> None:
    with _lock:
        _store[session_id] = session

def append_audit(session_id: str, entry: AuditEntry) -> None:
    with _lock:
        if session_id in _store:
            _store[session_id].audit_log.append(entry)
```

### LLM Detector — OpenRouter

```python
# backend/services/llm_detector.py
import httpx, json, os

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("LLM_MODEL", "deepseek/deepseek-chat")

PII_PROMPT = """You are a PII detection engine. Analyze the document and return ONLY a JSON array:
[{"start": int, "end": int, "text": str, "type": str, "confidence": float,
  "explanation": str, "pattern_matched": str}]
Types: NAME, EMAIL, PHONE, SSN, ADDRESS, DATE_OF_BIRTH, ID_NUMBER, CREDIT_CARD, OTHER
Return [] if no PII found. No markdown, no explanation outside the JSON.
Document:\n{text}"""

async def detect_llm(text: str, mode: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            OPENROUTER_URL,
            headers={"Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}"},
            json={"model": MODEL, "messages": [{"role": "user", "content": PII_PROMPT.format(text=text)}]}
        )
        content = resp.json()["choices"][0]["message"]["content"]
        # Strip markdown code fences if present
        content = content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        spans = json.loads(content)
        # Validate char offsets against actual text
        return [s for s in spans if 0 <= s["start"] < s["end"] <= len(text)]
```

### Zustand Store Structure

```typescript
// store/documentStore.ts
interface DocumentStore {
  document: Document | null;
  spans: Span[];
  activeSpanId: string | null;
  threshold: number;                       // 0–100, filters displayed spans
  decisions: Record<string, SpanAction>;   // spanId → action
  setDocument: (doc: Document) => void;
  setSpans: (spans: Span[]) => void;
  setActiveSpan: (id: string | null) => void;
  setThreshold: (t: number) => void;
  recordDecision: (spanId: string, action: SpanAction) => void;
  undoLastDecision: () => void;
}
```

---

## 15. Deliberate Scope Cuts (Writeup Material)

The submission writeup asks what you chose NOT to build and why. Use these points:

### What was NOT built and why:

**No PDF rendering or parsing**
The problem is about the review and correction experience, not document format handling. Text input is sufficient to demonstrate all three user journeys. Adding PDF parsing (PyMuPDF, pdfplumber) would have consumed 1–2 hours for zero UX benefit to the judges.

**No persistent database**
All three personas are session-based workers. Marcus reviews one document per session. Maya processes one batch per shift. Sam corrects one document at a time. There is no multi-day persistence need in any of these workflows. In-memory session state is correct for this scope.

**No user authentication**
The problem statements don't involve multi-user scenarios. Adding auth would have been scope creep — the judgment call was to spend that time on the UX features that actually matter to Marcus, Maya, and Sam.

**No real-time WebSockets for batch status**
SWR polling at 1500ms intervals is imperceptible to the user and eliminates WebSocket connection management complexity. The tradeoff is correct for a tool where "live" means "updated within 1.5 seconds."

**No secondary LLM detection pass for missed PII**
The `potentially_missed` flags in the correction mode are set by simple pattern-matching heuristics (phone number regex, name capitalization patterns) rather than a second LLM call. A second LLM call would double cost and latency. The UX insight (making Sam aware of possible misses) is identical either way.

**No multi-language PII support**
All detection is English-only. Internationalizing PII detection (different SSN formats, name conventions, phone formats) is a significant scope expansion that does not change the core UX problems any of the three personas face.

---

## 16. Deployment Checklist

### Frontend — Vercel
```bash
cd frontend
npx vercel --prod
# Set environment variable in Vercel dashboard:
# NEXT_PUBLIC_BACKEND_URL = https://your-railway-app.railway.app
```

### Backend — Railway
```bash
# In Railway dashboard:
# 1. New Project → Deploy from GitHub repo → select /backend
# 2. Add environment variables:
#    USE_LLM = true
#    LLM_MODEL = deepseek/deepseek-chat
#    OPENROUTER_API_KEY = sk-or-...
#    ALLOWED_ORIGINS = https://your-vercel-app.vercel.app
# 3. Railway auto-detects Dockerfile and deploys
```

### Local Development
```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
npm run dev
# → http://localhost:3000
```

### docker-compose (optional local shortcut)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:8000
    depends_on: [backend]
```

---

## 17. Submission Checklist

- [ ] Public GitHub repository with clean commit history
- [ ] `README.md` with prerequisites, install steps, and run commands
- [ ] `.env.example` committed (never `.env` itself)
- [ ] All three modes working in the deployed app
- [ ] Demo video recorded (walk: Trust mode → Correction mode → Batch mode)
- [ ] Short writeup (~half page): what was built + Section 15 scope cuts
- [ ] Resume added to GitHub repo root as `resume.pdf` or `resume.md`
- [ ] Deployment links tested and working:
  - [ ] Frontend: `https://your-app.vercel.app`
  - [ ] Backend: `https://your-app.railway.app/docs` (FastAPI auto-docs)
- [ ] Demo video shows:
  - [ ] Trust mode: paste doc → spans highlight → click span → explanation panel → why-not inspector → threshold slider → export
  - [ ] Correction mode: missed PII banner → two-lane review → friction gate trigger → manual span add → export
  - [ ] Batch mode: drag-drop files → queue fills → keyboard review → bulk export ZIP

---

## Quick Reference — Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Build 1, 2, or 3 problems? | All 3 as unified system | P1+P3 share 80% infrastructure; P2 added last |
| Real LLM or mock? | Feature-flagged; mock first | Build full UX before touching AI plumbing |
| Which LLM? | Deepseek V3 via OpenRouter | Free tier, OpenAI-compatible API, high quality |
| WebSockets or polling? | SWR polling at 1500ms | Simpler, imperceptible difference to user |
| Database or in-memory? | In-memory session dict | All personas are session-based; no multi-day need |
| ZIP on frontend or backend? | Backend (Python stdlib) | Keeps large file ops off main thread; no jszip dep |
| State management? | Zustand | Lighter than Redux; avoids Context prop-drilling |
| UI primitives? | Radix UI (unstyled) | Accessible by default; Tailwind controls appearance |

---

*Build plan version 1.0 — Generated for Sprintfour Hackathon*
*Strategy: Build shared core first, then P1, P3, P2 in sequence*
*If time runs out after P1+P3: still a complete, strong submission*
