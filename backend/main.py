from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_allowed_origins, load_backend_env
from routers.analyze import router as analyze_router
from routers.debug import router as debug_router
from routers.decisions import router as decisions_router
from routers.export import router as export_router

load_backend_env()

app = FastAPI(title="Conseal Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(debug_router)
app.include_router(decisions_router)
app.include_router(export_router)


@app.get("/health")
async def health() -> dict[str, object]:
    return {"ok": True, "service": "conseal-backend"}
