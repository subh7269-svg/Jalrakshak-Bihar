import os
import sys

# Ensure backend root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.session import engine, SessionLocal, Base
from app.database.seed_data import seed_database
from app.routers import (
    auth,
    locations,
    risk,
    priority,
    resources,
    shelters,
    roads,
    incidents,
    alerts,
    recommendations,
    audit_log,
    data_sources,
    simulation
)

app = FastAPI(
    title="JalRakshak Bihar",
    description="AI-Powered Flood Intelligence & Emergency Response Decision Support Platform for Bihar, India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc), "error_type": "ValidationError"}
    )

# Include API Routers with standard /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(priority.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(shelters.router, prefix="/api")
app.include_router(roads.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(audit_log.router, prefix="/api")
app.include_router(data_sources.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")

# Also alias root routes as requested in problem statement
app.include_router(locations.router, prefix="")
app.include_router(risk.router, prefix="")
app.include_router(priority.router, prefix="")
app.include_router(resources.router, prefix="")
app.include_router(shelters.router, prefix="")
app.include_router(incidents.router, prefix="")
app.include_router(alerts.router, prefix="")
app.include_router(recommendations.router, prefix="")
app.include_router(audit_log.router, prefix="")

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "JalRakshak Bihar API",
        "mode": "DEMO / SIMULATION MODE",
        "ml_engine": "RandomForest Hydrological Classifier (120 Estimators, Joblib Serialized)",
        "database": "SQLite / PostgreSQL Ready",
        "data_notice": "DEMO / SIMULATED DATA: Telemetry calibrated to Bihar river plains for decision-support evaluation."
    }

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
