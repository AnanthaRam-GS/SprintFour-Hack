from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.analyze import router as analyze_router

app = FastAPI(title="Conseal Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.get("/health")
async def health() -> dict[str, object]:
    return {"ok": True, "service": "conseal-backend"}
