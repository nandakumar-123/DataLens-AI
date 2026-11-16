from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config.config import settings
from app.database.database import Base, engine, get_db
from app.api import datasets, analysis

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DataLens AI API",
    description="Backend API for DataLens AI automated data analysis platform",
    version="0.1.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router)
app.include_router(analysis.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/health/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        # Simple query to verify db connectivity
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database connection failed")
