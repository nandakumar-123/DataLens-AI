from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.database.database import Base

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="created")
    combined_dataset_path = Column(String, nullable=True)
    
    # Agent 1 state
    agent1_state_json = Column(String, nullable=True) # Stores sequence of joins, excluded datasets, error states
    
    # Agent 2 state
    agent2_attempts = Column(Integer, default=0)
    agent2_quality_score = Column(Float, nullable=True)
    agent2_state_json = Column(String, nullable=True) # stores issues, history, recommendations
    
    # Agent 4 state
    agent4_state_json = Column(String, nullable=True) # stores stats and tests
    
    # Agent 6 state (ML Preparation)
    agent6_state_json = Column(String, nullable=True) # stores ml config, learning type, features, target
    
    # Agent 7 state (AutoML / Model Training)
    agent7_state_json = Column(String, nullable=True) # stores selected models, metrics, paths to .pkl artifacts
    
    # Agent 8 state (AI Insights & Final Report)
    agent8_state_json = Column(String, nullable=True) # stores ai insights, recommendations, final dashboard state
    
    datasets = relationship("DatasetMetadata", back_populates="session")

class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("analysis_sessions.id"))
    original_filename = Column(String, index=True)
    internal_path = Column(String)
    file_size_bytes = Column(Integer)
    mime_type = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    session = relationship("AnalysisSession", back_populates="datasets")
