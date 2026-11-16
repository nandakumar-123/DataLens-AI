from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DatasetMetadataBase(BaseModel):
    id: str
    original_filename: str
    file_size_bytes: int
    mime_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AnalysisSessionResponse(BaseModel):
    session_id: str
    status: str
    datasets: List[DatasetMetadataBase]
