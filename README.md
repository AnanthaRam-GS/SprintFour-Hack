# Conseal Hackathon — Unified PII Review System

Conseal is a full-stack PII anonymization review system built for the SprintFour hackathon. It combines three reviewer workflows in one shared product: trust-building review for anxious users, correction-focused review for catching tool mistakes, and a lightweight batch workflow for higher-volume processing.

## Modes

### Trust Mode / Marcus
- Review every redaction with evidence
- See confidence, explanation, and pattern details
- Inspect why visible text was kept visible

### Correction Mode / Sam
- Catch false positives and missed PII
- Work through a two-lane correction queue
- Manually flag missed PII and export only after a friction check

### Batch Mode / Maya
- Upload multiple `.txt` files
- Process files one-by-one through the shared review engine
- Use keyboard shortcuts and individual reviewed exports

## Architecture

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Pydantic, httpx
- **Shared review engine:** document viewer, span highlights, action bar, audit panel, export flow
- **State:** Zustand stores for active document review and lightweight batch queue management
- **Storage:** in-memory backend sessions, no database
- **Detection:** stable mock-first detector with optional OpenAI-compatible LLM path

## Local Setup

### Backend

```bash
cd backend
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

## Local URLs

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- Backend docs: `http://localhost:8000/docs`

## Environment Variables

### Frontend

- `NEXT_PUBLIC_BACKEND_URL`
  - Example: `http://localhost:8000`

### Backend

- `ALLOWED_ORIGINS`
  - Comma-separated CORS origins
  - Example: `http://localhost:3000,https://your-app.vercel.app`
- `USE_LLM`
  - `false` keeps the stable mock detector enabled
  - `true` enables the optional OpenAI-compatible LLM path
- `LLM_BASE_URL`
  - Example: `https://api.deepseek.com`
- `LLM_MODEL`
  - Example: `deepseek-chat`
- `LLM_API_KEY`
  - Required only when `USE_LLM=true`
- `LLM_TIMEOUT_SECONDS`
  - Optional request timeout override

## LLM Usage

- `USE_LLM=false` uses the stable mock detector for the most reliable hackathon demo path.
- `USE_LLM=true` enables OpenAI-compatible detection using providers such as DeepSeek, NVIDIA-hosted compatible gateways, or other `/chat/completions` style APIs.
- If the LLM request fails, returns invalid JSON, times out, or produces no valid spans, the backend automatically falls back to the mock detector.
- Correction Mode keeps its correction-specific demo behavior stable by supplementing missed-PII sample spans when needed.

## API Summary

- `POST /api/v1/analyze`
- `POST /api/v1/decisions`
- `GET /api/v1/export/{session_id}`
- `GET /health`

## Scope Cuts

- No auth
- No database
- No PDF/DOCX parsing
- Frontend-driven Batch Mode instead of a backend queue
- No bulk batch ZIP export
- No backend undo reversal

These are deliberate tradeoffs for an 8-hour solo hackathon build, keeping effort focused on the review UX and auditability instead of infrastructure-heavy features.

## Deployment

### Frontend

- Deploy to Vercel
- Set `NEXT_PUBLIC_BACKEND_URL` to your deployed backend URL

### Backend

- Deploy to Railway or Render
- Set `ALLOWED_ORIGINS` to your deployed frontend URL
- Keep `USE_LLM=false` for the most reliable demo unless you have a tested API key

## Demo Flow

1. Open the landing page
2. Demo Trust Mode
3. Demo Correction Mode
4. Demo Batch Mode
5. Export a redacted ZIP bundle

## Repo Notes

- `Build_Plan.md` is included as project planning documentation
- `WRITEUP.md` summarizes the hackathon tradeoffs and final scope
