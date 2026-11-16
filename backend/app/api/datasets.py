from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import mimetypes

from app.database.database import get_db
from app.config.config import settings
from app.models.dataset import AnalysisSession, DatasetMetadata
from app.schemas.dataset import AnalysisSessionResponse, DatasetMetadataBase

router = APIRouter(
    prefix="/api/datasets",
    tags=["datasets"]
)

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

@router.post("/upload", response_model=AnalysisSessionResponse)
async def upload_datasets(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Create a new Analysis Session
    session_id = str(uuid.uuid4())
    db_session = AnalysisSession(id=session_id, status="created")
    db.add(db_session)
    
    datasets = []
    
    for file in files:
        # Validate filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a name")
        
        # Validate extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file extension: {ext}. Only CSV and Excel files are allowed.")
            
        # Validate mime type
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]
        if mime_type not in ALLOWED_MIME_TYPES:
            # Fallback for some clients that don't send proper mime types for csv/excel
            if ext == ".csv":
                mime_type = "text/csv"
            elif ext == ".xls":
                mime_type = "application/vnd.ms-excel"
            elif ext == ".xlsx":
                mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported MIME type: {mime_type}")
                
        # Read content to validate size and empty file
        content = await file.read()
        file_size = len(content)
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail=f"File {file.filename} is empty")
            
        if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds the maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB")
            
        # Generate safe internal filename and save
        internal_filename = f"{uuid.uuid4()}{ext}"
        internal_path = os.path.join(settings.UPLOAD_DIR, internal_filename)
        
        with open(internal_path, "wb") as f:
            f.write(content)
            
        # Create metadata record
        db_dataset = DatasetMetadata(
            id=str(uuid.uuid4()),
            session_id=session_id,
            original_filename=file.filename,
            internal_path=internal_path,
            file_size_bytes=file_size,
            mime_type=mime_type
        )
        db.add(db_dataset)
        datasets.append(db_dataset)
        
    db.commit()
    db.refresh(db_session)
    
    return AnalysisSessionResponse(
        session_id=db_session.id,
        status=db_session.status,
        datasets=[
            DatasetMetadataBase.model_validate(ds)
            for ds in datasets
        ]
    )

@router.post("/demo/{demo_key}", response_model=AnalysisSessionResponse)
async def load_demo_dataset(demo_key: str, db: Session = Depends(get_db)):
    """Creates a new session preloaded with one of the curated demo datasets."""
    demo_files = {
        "churn": ("customer_churn.csv", "sample_data/customer_churn.csv"),
        "sales": ("ecommerce_sales.csv", "sample_data/ecommerce_sales.csv"),
        "health": ("healthcare_diagnostics.csv", "sample_data/healthcare_diagnostics.csv"),
    }
    
    if demo_key not in demo_files:
        raise HTTPException(status_code=404, detail=f"Demo dataset '{demo_key}' not found. Available: {list(demo_files.keys())}")
        
    original_filename, source_rel_path = demo_files[demo_key]
    # Check absolute or relative location
    source_path = os.path.join(os.getcwd(), source_rel_path)
    if not os.path.exists(source_path):
        # Generate on the fly if needed
        import importlib.util
        script_path = os.path.join(os.getcwd(), "create_demo_data.py")
        if os.path.exists(script_path):
            os.system(f"python {script_path}")
            
    if not os.path.exists(source_path):
        raise HTTPException(status_code=500, detail="Demo dataset file could not be generated.")

    session_id = str(uuid.uuid4())
    db_session = AnalysisSession(id=session_id, status="created")
    db.add(db_session)
    
    ext = os.path.splitext(original_filename)[1].lower()
    internal_filename = f"{uuid.uuid4()}{ext}"
    internal_path = os.path.join(settings.UPLOAD_DIR, internal_filename)
    
    with open(source_path, "rb") as src, open(internal_path, "wb") as dst:
        content = src.read()
        dst.write(content)
        
    db_dataset = DatasetMetadata(
        id=str(uuid.uuid4()),
        session_id=session_id,
        original_filename=original_filename,
        internal_path=internal_path,
        file_size_bytes=len(content),
        mime_type="text/csv"
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_session)
    
    return AnalysisSessionResponse(
        session_id=db_session.id,
        status=db_session.status,
        datasets=[DatasetMetadataBase.model_validate(db_dataset)]
    )

@router.get("/sessions")
async def list_recent_sessions(limit: int = 15, db: Session = Depends(get_db)):
    """Returns recent analysis sessions with basic stats."""
    sessions = db.query(AnalysisSession).order_by(AnalysisSession.created_at.desc()).limit(limit).all()
    result = []
    for s in sessions:
        ds_names = [d.original_filename for d in s.datasets]
        result.append({
            "session_id": s.id,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "datasets": ds_names,
            "has_combined": bool(s.combined_dataset_path),
            "has_model": bool(s.agent7_state_json),
            "quality_score": s.agent2_quality_score
        })
    return result

