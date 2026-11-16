import os
import json
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.database import get_db
from app.models.dataset import AnalysisSession

router = APIRouter()

@router.get("/{session_id}/agent-7/result")
async def agent7_result(session_id: str, db: Session = Depends(get_db)):
    from app.tools.profiling import sanitize_for_json
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent7_state_json:
        raise HTTPException(status_code=404, detail="Agent 7 state not found.")
        
    a7_state = json.loads(session.agent7_state_json)
    return sanitize_for_json(a7_state)

class Agent7PredictRequest(BaseModel):
    features: Dict[str, Any]

@router.post("/{session_id}/agent-7/predict/{model_id}")
async def agent7_predict(session_id: str, model_id: str, req: Agent7PredictRequest, db: Session = Depends(get_db)):
    import joblib
    import pandas as pd
    import numpy as np
    
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent7_state_json:
        raise HTTPException(status_code=404, detail="Agent 7 state not found.")
        
    a7_state = json.loads(session.agent7_state_json)
    trained_models = a7_state.get("trained_models", [])
    
    target_model = None
    for m in trained_models:
        if m.get("model_id") == model_id:
            target_model = m
            break
            
    if not target_model:
        raise HTTPException(status_code=404, detail="Model ID not found in session.")
        
    model_path = target_model.get("path")
    if not model_path or not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model artifact file missing.")
        
    try:
        pipeline = joblib.load(model_path)
        
        # Build one-row dataframe
        df = pd.DataFrame([req.features])
        
        # Predict
        pred = pipeline.predict(df)
        
        # Prepare response
        result = {
            "prediction": pred[0]
        }
        
        # Convert numpy types to native python for json serialization
        if hasattr(result["prediction"], "item"):
            result["prediction"] = result["prediction"].item()
            
        # Try predict_proba if available
        if hasattr(pipeline, "predict_proba"):
            proba = pipeline.predict_proba(df)
            # Take the max probability for the predicted class
            # or return the full dict if needed. For simplicity, just max probability.
            max_prob = float(np.max(proba[0]))
            result["probability"] = max_prob
            
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")
