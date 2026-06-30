import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.analyze import router as analyze_router
from routers.decisions import router as decisions_router
from routers.export import router as export_router

app = FastAPI(title="Conseal Backend")


def _allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(decisions_router)
app.include_router(export_router)


@app.get("/health")
async def health() -> dict[str, object]:
    return {"ok": True, "service": "conseal-backend"}
