from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import os
import json

from app.database.database import get_db
from app.models.dataset import AnalysisSession, DatasetMetadata
from app.tools.profiling import profile_dataset
from app.tools.relationship_analysis import analyze_relationships
from app.tools.combination import execute_join, execute_concatenate
from app.agents.ingestion_agent import recommend_relationship
from app.agents.combination_agent import generate_combination_plan
from app.config.config import settings

router = APIRouter(
    prefix="/api/analysis",
    tags=["analysis"]
)

class CombinePlanRequest(BaseModel):
    prompt: str

class CombineRequest(BaseModel):
    combination_type: str = "JOIN" # JOIN or CONCATENATE
    # For JOIN
    left: str = None
    right: str = None
    left_key: str = None
    right_key: str = None
    type: str = "LEFT"
    # For CONCATENATE
    datasets: List[str] = []

@router.post("/{session_id}/agent-1/profile")
async def run_agent_1_profile(session_id: str, db: Session = Depends(get_db)):
    # 1. Validate session
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    datasets = db.query(DatasetMetadata).filter(DatasetMetadata.session_id == session_id).all()
    if not datasets:
        raise HTTPException(status_code=400, detail="No datasets uploaded for this session")
        
    try:
        # Update state to processing
        session.status = "agent_1_processing"
        db.commit()
        
        # 2-3. Profile datasets deterministically
        profiles = []
        for ds in datasets:
            if not os.path.exists(ds.internal_path):
                raise HTTPException(status_code=500, detail=f"File missing for {ds.original_filename}")
                
            profile = profile_dataset(ds.internal_path, ds.original_filename)
            profiles.append(profile)
            
        if len(datasets) == 1:
            # Single dataset bypass
            session.combined_dataset_path = datasets[0].internal_path
            session.status = "agent_1_completed"
            session.agent2_state_json = None
            session.agent2_attempts = 0
            session.agent2_quality_score = None
            db.commit()
            from app.tools.profiling import sanitize_for_json
            return sanitize_for_json({
                "session_id": session_id,
                "status": "completed",
                "profiles": profiles,
                "relationships": [],
                "recommendation": None
            })
            
        dataset_map = {ds.original_filename: ds.internal_path for ds in datasets}
        
        # 4. Detect relationships deterministically with overlap
        relationships = analyze_relationships(profiles, dataset_map)
        
        # 5. Generate AI recommendation
        ai_recommendation = await recommend_relationship(profiles, relationships)
        
        # 6. Save required workflow state (we just update the session status here for simplicity)
        session.status = "agent_1_profiled"
        db.commit()
        
        # 7. Return structured results
        from app.tools.profiling import sanitize_for_json
        import json
        
        sanitized = sanitize_for_json({
            "session_id": session_id,
            "status": "profiled",
            "profiles": profiles,
            "relationships": relationships,
            "recommendation": ai_recommendation
        })
        
        try:
            # Force serialization to catch NaN immediately
            json.dumps(sanitized, allow_nan=False)
        except ValueError as ve:
            raise RuntimeError(f"JSON NaN serialization error. Data: {repr(sanitized)}")
            
        return sanitized
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Revert status on error
        session.status = "agent_1_error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Agent 1 processing failed: {str(e)}")

@router.post("/{session_id}/agent-1/combination-plan")
async def get_combination_plan(session_id: str, req: CombinePlanRequest, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    datasets = db.query(DatasetMetadata).filter(DatasetMetadata.session_id == session_id).all()
    profiles = []
    for ds in datasets:
        if os.path.exists(ds.internal_path):
            profiles.append(profile_dataset(ds.internal_path, ds.original_filename))
            
    result = await generate_combination_plan(req.prompt, profiles)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result["combination_plan"]

@router.post("/{session_id}/agent-1/combine")
async def combine_datasets(session_id: str, req: CombineRequest, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    datasets = db.query(DatasetMetadata).filter(DatasetMetadata.session_id == session_id).all()
    dataset_map = {ds.original_filename: ds.internal_path for ds in datasets}
    
    # Check if this is a step in a chain. 
    # For this prompt, req can just be one join, but if it's the second join, left might be 'combined' 
    if session.combined_dataset_path:
        dataset_map["__previous_combined__"] = session.combined_dataset_path
        if req.left not in dataset_map and (req.left == "Combined Dataset" or req.left == "CURRENT_RESULT"):
            req.left = "__previous_combined__"
    
    try:
        if req.combination_type == "CONCATENATE":
            plan = {
                "datasets": req.datasets
            }
            # Replace placeholder names for concatenation
            if session.combined_dataset_path:
                dataset_map["__previous_combined__"] = session.combined_dataset_path
                plan["datasets"] = ["__previous_combined__" if d in ["Combined Dataset", "CURRENT_RESULT"] else d for d in plan["datasets"]]
            
            result = execute_concatenate(plan, dataset_map, output_dir=settings.UPLOAD_DIR)
        else:
            plan = {
                "left": req.left,
                "right": req.right,
                "left_key": req.left_key,
                "right_key": req.right_key,
                "type": req.type
            }
            result = execute_join(plan, dataset_map, output_dir=settings.UPLOAD_DIR)
        
        # Save intermediate/final combined dataset path
        session.combined_dataset_path = result["result_path"]
        session.status = "agent_1_completed"
        session.agent2_state_json = None
        session.agent2_attempts = 0
        session.agent2_quality_score = None
        db.commit()
        
        return result
    except ValueError as ve:
        # Structured validation error from Python logic (safe to show user)
        session.status = "agent_1_combination_error"
        db.commit()
        raise HTTPException(status_code=400, detail={
            "error_code": "COMBINATION_VALIDATION_ERROR",
            "title": "Combination Error",
            "message": str(ve),
            "recoverable": True
        })
    except Exception as e:
        # Generic/Runtime error (hide raw traces)
        session.status = "agent_1_error"
        db.commit()
        raise HTTPException(status_code=500, detail={
            "error_code": "INTERNAL_PROCESSING_ERROR",
            "title": "Combination Could Not Be Completed",
            "message": "The dataset combination requires more processing resources than currently available or an unexpected error occurred.",
            "recoverable": False
        })

@router.get("/{session_id}/agent-1/result")
async def get_agent_1_result(session_id: str, db: Session = Depends(get_db)):
    import pandas as pd
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    datasets = db.query(DatasetMetadata).filter(DatasetMetadata.session_id == session_id).all()
    
    if session.combined_dataset_path and os.path.exists(session.combined_dataset_path):
        df = pd.read_csv(session.combined_dataset_path, low_memory=False)
        return {
            "status": session.status,
            "datasets_combined": len(datasets),
            "filename": f"datalens_combined_{session_id}.csv" if len(datasets) > 1 else datasets[0].original_filename,
            "rows": len(df),
            "columns": len(df.columns)
        }
        
    raise HTTPException(status_code=400, detail="Combination not yet complete")

@router.get("/{session_id}/agent-1/download")
async def download_combined(session_id: str, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if not session.combined_dataset_path or not os.path.exists(session.combined_dataset_path):
        raise HTTPException(status_code=404, detail="Combined dataset not found")
        
    return FileResponse(
        path=session.combined_dataset_path, 
        filename=f"datalens_combined_{session_id}.csv",
        media_type="text/csv"
    )

class CleanDecisions(BaseModel):
    duplicates: str = "keep"
    missing: Dict[str, str] = {}
    outliers: Dict[str, str] = {}

from app.tools.quality import analyze_quality, apply_cleaning
from app.agents.cleaning_agent import recommend_cleaning
import pandas as pd
import uuid

@router.post("/{session_id}/agent-2/analyze")
async def analyze_quality_endpoint(session_id: str, db: Session = Depends(get_db)):
    from app.tools.profiling import sanitize_for_json
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if not session.combined_dataset_path or not os.path.exists(session.combined_dataset_path):
        raise HTTPException(status_code=400, detail="Combined dataset missing. Complete Agent 1 first.")
        
    try:
        session.status = "agent_2_processing"
        db.commit()
        
        # Determine which file to read (current latest version)
        state = json.loads(session.agent2_state_json) if session.agent2_state_json else {}
        current_path = state.get("current_path", session.combined_dataset_path)
        
        df = pd.read_csv(current_path, low_memory=False)
        quality_report = analyze_quality(df)
        
        recommendations = await recommend_cleaning(quality_report)
        
        # Save state
        state["initial_report"] = quality_report
        state["current_report"] = quality_report
        state["recommendations"] = recommendations
        state["current_path"] = current_path
        
        session.agent2_quality_score = quality_report["score"]
        session.agent2_state_json = json.dumps(sanitize_for_json(state))
        
        if quality_report["score"] >= 95.0 or session.agent2_attempts >= 3:
            session.status = "agent_2_completed"
        else:
            session.status = "agent_2_approval_needed"
            
        db.commit()
        
        return sanitize_for_json({
            "score": quality_report["score"],
            "attempts": session.agent2_attempts,
            "report": quality_report,
            "recommendations": recommendations
        })
    except Exception as e:
        session.status = "agent_2_error"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/agent-2/clean")
async def apply_cleaning_endpoint(session_id: str, decisions: CleanDecisions, db: Session = Depends(get_db)):
    from app.tools.profiling import sanitize_for_json
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.agent2_attempts >= 3:
        raise HTTPException(status_code=400, detail="Maximum safe cleaning attempts reached (3/3).")
        
    try:
        state = json.loads(session.agent2_state_json)
        current_path = state.get("current_path", session.combined_dataset_path)
        
        df = pd.read_csv(current_path, low_memory=False)
        cleaning_dict = decisions.model_dump() if hasattr(decisions, "model_dump") else decisions.dict()
        cleaned_df = apply_cleaning(df, cleaning_dict)
        
        # Save new version
        new_path = os.path.join(settings.UPLOAD_DIR, f"cleaned_{uuid.uuid4().hex}.csv")
        cleaned_df.to_csv(new_path, index=False)
        
        # Re-evaluate
        new_report = analyze_quality(cleaned_df)
        
        # Update history
        history = state.get("history", [])
        history.append({
            "attempt": session.agent2_attempts + 1,
            "old_score": session.agent2_quality_score,
            "new_score": new_report["score"]
        })
        
        state["history"] = history
        state["current_report"] = new_report
        state["current_path"] = new_path
        
        session.agent2_attempts += 1
        session.agent2_quality_score = new_report["score"]
        session.agent2_state_json = json.dumps(sanitize_for_json(state))
        
        if new_report["score"] >= 95.0 or session.agent2_attempts >= 3:
            session.status = "agent_2_completed"
        else:
            # Re-generate recommendations for next loop if needed, but for simplicity, let frontend ask again if needed
            session.status = "agent_2_approval_needed"
            
        db.commit()
        
        return sanitize_for_json({
            "status": session.status,
            "score": new_report["score"],
            "attempts": session.agent2_attempts,
            "report": new_report,
            "history": history
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/agent-2/result")
async def get_cleaning_result(session_id: str, db: Session = Depends(get_db)):
    from app.tools.profiling import sanitize_for_json
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent2_state_json:
        raise HTTPException(status_code=404, detail="Agent 2 state not found")
        
    state = json.loads(session.agent2_state_json)
    
    return sanitize_for_json({
        "status": session.status,
        "score": session.agent2_quality_score,
        "attempts": session.agent2_attempts,
        "initial_report": state.get("initial_report"),
        "current_report": state.get("current_report"),
        "history": state.get("history", []),
        "ai_summary": state.get("recommendations", {}).get("ai_summary", "No AI summary generated.")
    })

@router.get("/{session_id}/agent-3/validate")
async def validate_dataset(session_id: str, db: Session = Depends(get_db)):
    import pandas as pd
    from app.tools.profiling import sanitize_for_json
    
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    current_path = session.combined_dataset_path
    
    if session.agent2_state_json:
        state = json.loads(session.agent2_state_json)
        current_path = state.get("current_path", current_path)
        
    if not current_path or not os.path.exists(current_path):
        raise HTTPException(status_code=400, detail="Cleaned combined dataset not found")
        
    try:
        session.status = "agent_3_processing"
        db.commit()
        
        # Load the dataset
        df = pd.read_csv(current_path, low_memory=False)
        
        if df.empty or len(df.columns) == 0:
            raise ValueError("Dataset is empty or has no columns.")
            
        numeric_cols = df.select_dtypes(include='number').columns.tolist()
        date_cols = df.select_dtypes(include='datetime').columns.tolist()
        categorical_cols = [c for c in df.columns if c not in numeric_cols and c not in date_cols]
        
        missing_count = int(df.isna().sum().sum())
        
        preview = df.head(5).to_dict(orient="records")
        
        session.status = "agent_3_completed"
        db.commit()
        
        return sanitize_for_json({
            "status": "validated",
            "filename": "Cleaned Combined Dataset",
            "rows": len(df),
            "columns": len(df.columns),
            "numeric_columns": len(numeric_cols),
            "categorical_columns": len(categorical_cols),
            "date_columns": len(date_cols),
            "missing_values": missing_count,
            "preview": preview
        })
    except Exception as e:
        session.status = "agent_3_error"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/agent-3/download")
async def download_agent3_dataset(session_id: str, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    current_path = session.combined_dataset_path
    if session.agent2_state_json:
        state = json.loads(session.agent2_state_json)
        current_path = state.get("current_path", current_path)
        
    if not current_path or not os.path.exists(current_path):
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    return FileResponse(
        path=current_path, 
        filename=f"datalens_ready_{session_id}.csv",
        media_type="text/csv"
    )



class AskRequest(BaseModel):
    question: str

@router.post("/{session_id}/agent-4/analyze")
async def run_agent_4_analysis(session_id: str, db: Session = Depends(get_db)):
    from app.tools.statistics import calculate_descriptive_stats, calculate_categorical_stats, calculate_correlations, run_hypothesis_tests
    from app.agents.research_agent import generate_statistical_summary
    from app.tools.profiling import sanitize_for_json
    import pandas as pd
    
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    current_path = session.combined_dataset_path
    if session.agent2_state_json:
        state = json.loads(session.agent2_state_json)
        current_path = state.get("current_path", current_path)
        
    if not current_path or not os.path.exists(current_path):
        raise HTTPException(status_code=400, detail="Cleaned dataset not found. Complete previous agents first.")
        
    try:
        session.status = "agent_4_processing"
        db.commit()
        
        df = pd.read_csv(current_path, low_memory=False)
        
        numeric_cols = df.select_dtypes(include='number').columns.tolist()
        date_cols = df.select_dtypes(include='datetime').columns.tolist()
        categorical_cols = [c for c in df.columns if c not in numeric_cols and c not in date_cols]
        
        # 1. Descriptive stats
        desc_stats = calculate_descriptive_stats(df, numeric_cols)
        
        # 2. Categorical stats
        cat_stats = calculate_categorical_stats(df, categorical_cols)
        
        # 3. Correlations
        correlations = calculate_correlations(df, numeric_cols)
        
        # 4. Hypothesis tests
        tests = run_hypothesis_tests(df, numeric_cols, categorical_cols)
        
        stats_payload = {
            "rows": len(df),
            "columns": len(df.columns),
            "numerical_count": len(numeric_cols),
            "categorical_count": len(categorical_cols),
            "descriptive": desc_stats,
            "categorical": cat_stats,
            "correlations": correlations,
            "hypothesis_tests": tests
        }
        
        # 5. AI Summary
        ai_summary = await generate_statistical_summary(stats_payload)
        stats_payload["ai_summary"] = ai_summary
        
        sanitized = sanitize_for_json(stats_payload)
        
        session.agent4_state_json = json.dumps(sanitized)
        session.status = "agent_4_completed"
        db.commit()
        return sanitized
    except Exception as e:
        import traceback
        traceback.print_exc()
        session.status = "agent_4_error"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

class AskRequest(BaseModel):
    question: str

@router.post("/{session_id}/agent-4/ask")
async def ask_agent_4_question(session_id: str, req: AskRequest, db: Session = Depends(get_db)):
    from app.agents.research_agent import answer_statistical_question
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent4_state_json:
        raise HTTPException(status_code=400, detail="Agent 4 analysis not found. Run analysis first.")
    stats = json.loads(session.agent4_state_json)
    try:
        answer = await answer_statistical_question(req.question, stats)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AGENT 6: ML PREPARATION
# ==========================================

from typing import List, Optional
class MLTypeSelection(BaseModel):
    learning_type: str

class MLConfig(BaseModel):
    target: Optional[str] = None
    features: List[str] = []

@router.post("/{session_id}/agent-6/analyze")
async def agent6_analyze(session_id: str, db: Session = Depends(get_db)):
    from app.tools.ml_prep import analyze_ml_potential
    from app.agents.ml_agent import recommend_learning_type
    
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.combined_dataset_path:
        raise HTTPException(status_code=400, detail="Session or dataset not found.")
        
    try:
        session.status = "agent_6_processing"
        db.commit()
        
        current_path = session.combined_dataset_path
        if session.agent2_state_json:
            a2_state = json.loads(session.agent2_state_json)
            current_path = a2_state.get("current_path", current_path)
            
        df = pd.read_csv(current_path, low_memory=False)
        
        metadata = analyze_ml_potential(df)
        rec = await recommend_learning_type(metadata)
        
        state = {
            "metadata": metadata,
            "ai_learning_type_rec": rec,
            "learning_type": None
        }
        session.agent6_state_json = json.dumps(state)
        session.status = "agent_6_type_selection"
        db.commit()
        
        return state
    except Exception as e:
        session.status = "agent_6_error"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/agent-6/learning-type")
async def agent6_set_learning_type(session_id: str, payload: MLTypeSelection, db: Session = Depends(get_db)):
    from app.agents.ml_agent import recommend_features_target
    
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent6_state_json:
        raise HTTPException(status_code=400, detail="Agent 6 state not found.")
        
    try:
        state = json.loads(session.agent6_state_json)
        learning_type = payload.learning_type
        
        if learning_type not in ["supervised", "unsupervised"]:
            raise HTTPException(status_code=400, detail="Invalid learning type.")
            
        state["learning_type"] = learning_type
        
        if learning_type == "supervised":
            metadata = state.get("metadata", {})
            xy_rec = await recommend_features_target(metadata)
            state["ai_xy_rec"] = xy_rec
            session.status = "agent_6_xy_selection"
        else:
            state["ai_xy_rec"] = None
            session.status = "agent_6_config_review"
            
        session.agent6_state_json = json.dumps(state)
        db.commit()
        
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/agent-6/config")
async def agent6_set_config(session_id: str, payload: MLConfig, db: Session = Depends(get_db)):
    from app.tools.ml_prep import validate_xy, check_imbalance, detect_leakage, recommend_preprocessing
    from app.tools.profiling import sanitize_for_json
    
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent6_state_json:
        raise HTTPException(status_code=400, detail="Agent 6 state not found.")
        
    try:
        state = json.loads(session.agent6_state_json)
        learning_type = state.get("learning_type")
        
        current_path = session.combined_dataset_path
        if session.agent2_state_json:
            a2_state = json.loads(session.agent2_state_json)
            current_path = a2_state.get("current_path", current_path)
            
        df = pd.read_csv(current_path, low_memory=False)
        
        if learning_type == "supervised":
            valid, msg = validate_xy(df, payload.target, payload.features)
            if not valid:
                raise HTTPException(status_code=400, detail=msg)
                
            state["target"] = payload.target
            state["features"] = payload.features
            
            imbalance = check_imbalance(df, payload.target)
            leakage = detect_leakage(df, payload.target, payload.features)
            prep = recommend_preprocessing(df, payload.features)
            
            state["imbalance"] = imbalance
            state["leakage"] = leakage
            state["preprocessing"] = prep
        else:
            state["target"] = None
            state["features"] = list(df.columns)
            state["imbalance"] = {"detected": False, "reason": "Not applicable for unsupervised"}
            state["leakage"] = []
            state["preprocessing"] = recommend_preprocessing(df, list(df.columns))
            
        session.status = "agent_6_completed"
        session.agent6_state_json = json.dumps(sanitize_for_json(state))
        db.commit()
        
        return sanitize_for_json(state)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/agent-6/result")
async def agent6_result(session_id: str, db: Session = Depends(get_db)):
    from app.tools.profiling import sanitize_for_json
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent6_state_json:
        raise HTTPException(status_code=404, detail="Agent 6 state not found.")
    
    return sanitize_for_json(json.loads(session.agent6_state_json))

# AGENT 7: AUTOML / MODEL SELECTION
# ==========================================

from app.agents.automl_agent import recommend_models, explain_results
from app.tools.automl import get_compatible_models, train_supervised, train_unsupervised
from fastapi.responses import FileResponse

class Agent7TrainRequest(BaseModel):
    models: List[str]

@router.get("/{session_id}/agent-7/recommend")
async def agent7_recommend(session_id: str, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent6_state_json:
        raise HTTPException(status_code=400, detail="Agent 6 config not found.")
        
    a6_state = json.loads(session.agent6_state_json)
    learning_type = a6_state.get("learning_type")
    
    # Check problem type if supervised
    problem_type = None
    if learning_type == "supervised":
        target = a6_state.get("target")
        current_path = session.combined_dataset_path
        if session.agent2_state_json:
            a2 = json.loads(session.agent2_state_json)
            current_path = a2.get("current_path", current_path)
            
        df = pd.read_csv(current_path, low_memory=False)
        # determine if target is categorical or continuous
        if pd.api.types.is_numeric_dtype(df[target]):
            if len(df[target].unique()) < 20:
                problem_type = "classification"
            else:
                problem_type = "regression"
        else:
            problem_type = "classification"
            
    # AI recommendations
    ai_models = await recommend_models(a6_state.get("metadata", {}), learning_type, problem_type)
    
    # All compatible models
    compatible = get_compatible_models(learning_type, problem_type)
    
    response = {
        "learning_type": learning_type,
        "problem_type": problem_type,
        "target": a6_state.get("target"),
        "features": a6_state.get("features", []),
        "ai_recommended_models": ai_models,
        "compatible_models": compatible
    }
    
    # Initialize agent 7 state
    session.status = "agent_7_selection"
    session.agent7_state_json = json.dumps(response)
    db.commit()
    
    return response

@router.post("/{session_id}/agent-7/train")
async def agent7_train(session_id: str, payload: Agent7TrainRequest, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent7_state_json:
        raise HTTPException(status_code=400, detail="Agent 7 config not found. Run recommend first.")
        
    a7_state = json.loads(session.agent7_state_json)
    learning_type = a7_state.get("learning_type")
    problem_type = a7_state.get("problem_type")
    features = a7_state.get("features", [])
    target = a7_state.get("target")
    
    current_path = session.combined_dataset_path
    if session.agent2_state_json:
        a2 = json.loads(session.agent2_state_json)
        current_path = a2.get("current_path", current_path)
        
    try:
        session.status = "agent_7_training"
        db.commit()
        
        df = pd.read_csv(current_path, low_memory=False)
        
        trained_models = []
        
        def run_models(model_list):
            for model_name in model_list:
                if learning_type == "supervised":
                    res = train_supervised(model_name, df, features, target, problem_type)
                else:
                    res = train_unsupervised(model_name, df, features)
                trained_models.append(res)
                
        # 1. Initial Pass
        run_models(payload.models)
        
        # 2. Select best model & check reliability
        def check_reliability(models):
            if not models:
                return False, None
            if learning_type == "supervised":
                valid_models = [m for m in models if m.get("cv_score", -999) > -900]
                if not valid_models:
                    valid_models = models
                
                good_models = [m for m in valid_models if "Overfitting" not in m.get("status", "") and "Underfitting" not in m.get("status", "") and "Leakage" not in m.get("status", "")]
                pool = good_models if good_models else valid_models
                
                if problem_type == "classification":
                    b_model = max(pool, key=lambda x: (x.get("cv_score", 0), x.get("main_score", 0)))
                else:
                    b_model = max(pool, key=lambda x: (x.get("cv_score", -999), x.get("main_score", -999)))
                return True, b_model
            else:
                b_model = max(models, key=lambda x: x.get("main_score", -999))
                return True, b_model
            
        is_reliable, best_model = check_reliability(trained_models)
        
        # 3. Fallback Pass (if no models could be selected) - auto-try 1 robust model
        if not is_reliable and learning_type == "supervised":
            from app.tools.automl import get_compatible_models
            all_compatible = get_compatible_models(learning_type, problem_type)
            tried_names = {m["name"] for m in trained_models}
            remaining = [m for m in all_compatible if m not in tried_names]
            
            fallback = None
            if remaining:
                if problem_type == "classification":
                    preferred = ["XGBoost", "Random Forest", "Logistic Regression", "Gradient Boosting"]
                else:
                    preferred = ["XGBoost Regressor", "Random Forest Regressor", "Ridge", "Gradient Boosting Regressor"]
                
                for p in preferred:
                    if p in remaining:
                        fallback = p
                        break
                if not fallback:
                    fallback = remaining[0]
            
            if fallback:
                run_models([fallback])
                trained_models[-1]["is_fallback"] = True
                is_reliable, best_model = check_reliability(trained_models)
        
        # Final safety ranking
        if not best_model and trained_models:
            if learning_type == "supervised":
                best_model = max(trained_models, key=lambda x: x.get("cv_score", -999))
            else:
                best_model = max(trained_models, key=lambda x: x.get("main_score", -999))
            is_reliable = True
                
        # Ask AI for explanation
        summary = {
            "problem": problem_type or "clustering",
            "models": [{"name": m["name"], "train_score": m["main_score"], "cv_score": m.get("cv_score"), "status": m["status"]} for m in trained_models]
        }
        explanation = await explain_results(summary)
        
        # Sample row for interactive prediction testing in UI
        sample_row = {}
        if not df.empty:
            first_row = df.iloc[0]
            for f in features:
                if f in first_row:
                    val = first_row[f]
                    if pd.notna(val):
                        sample_row[f] = val.item() if hasattr(val, 'item') else val
                    else:
                        sample_row[f] = ""
        
        a7_state["sample_row"] = sample_row
        a7_state["features"] = features
        a7_state["target"] = target
        a7_state["problem_type"] = problem_type
        a7_state["learning_type"] = learning_type
        a7_state["trained_models"] = trained_models
        a7_state["best_model"] = best_model
        a7_state["is_reliable"] = is_reliable
        a7_state["explanation"] = explanation
        
        from app.tools.profiling import sanitize_for_json
        a7_state = sanitize_for_json(a7_state)
        
        session.agent7_state_json = json.dumps(a7_state)
        session.status = "agent_7_completed"
        db.commit()
        
        return a7_state
    except Exception as e:
        session.status = "agent_7_error"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/agent-7/download/{model_id}")
async def agent7_download(session_id: str, model_id: str, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent7_state_json:
        raise HTTPException(status_code=404, detail="Agent 7 state not found.")
        
    a7_state = json.loads(session.agent7_state_json)
    trained_models = a7_state.get("trained_models", [])
    
    for m in trained_models:
        if m.get("model_id") == model_id:
            path = m.get("path")
            if path and os.path.exists(path):
                return FileResponse(path, media_type='application/octet-stream', filename=f"{m.get('name')}.pkl")
    raise HTTPException(status_code=404, detail="Model file not found.")

@router.get("/{session_id}/agent-7/result")
async def agent7_result(session_id: str, db: Session = Depends(get_db)):
    from app.tools.profiling import sanitize_for_json
    import pandas as pd
    import os
    
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent7_state_json:
        raise HTTPException(status_code=404, detail="Agent 7 state not found.")
        
    a7_state = json.loads(session.agent7_state_json)
    
    # Attempt to load a sample row for pre-filling
    try:
        current_path = session.combined_dataset_path
        if session.agent2_state_json:
            a2 = json.loads(session.agent2_state_json)
            current_path = a2.get("current_path", current_path)
            
        if current_path and os.path.exists(current_path):
            df = pd.read_csv(current_path, nrows=1)
            df = df.fillna("")
            a7_state["sample_row"] = df.iloc[0].to_dict()
    except Exception as e:
        print(f"Failed to load sample row: {e}")
        
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
        # Predict or Transform
        if hasattr(pipeline, "predict"):
            pred = pipeline.predict(df)
            result = {"prediction": pred[0]}
            
            # Convert numpy types to native python for json serialization
            if hasattr(result["prediction"], "item"):
                result["prediction"] = result["prediction"].item()
                
        elif hasattr(pipeline, "transform"):
            transformed = pipeline.transform(df)
            result = {"prediction": f"Transformed vector: {np.round(transformed[0], 4).tolist()}"}
        else:
            raise ValueError(f"The selected model ({target_model.get('name')}) does not support predictions on new data (it lacks both predict and transform methods).")
            
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


# ==========================================
# AGENT 8: Final Report & AI Insights
# ==========================================

@router.post("/{session_id}/agent-8/run")
def agent8_run(session_id: str, db: Session = Depends(get_db)):
    from app.tools.agent8_reporting import generate_agent8_report_data
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    session_data = {
        "dataset_path": session.combined_dataset_path,
        "agent2_state": json.loads(session.agent2_state_json) if session.agent2_state_json else {},
        "agent4_state": json.loads(session.agent4_state_json) if session.agent4_state_json else {},
        "agent6_state": json.loads(session.agent6_state_json) if session.agent6_state_json else {},
        "agent7_state": json.loads(session.agent7_state_json) if session.agent7_state_json else {}
    }
    
    final_state = generate_agent8_report_data(session_data)
    session.agent8_state_json = json.dumps(final_state)
    db.commit()
    
    return {"status": "success"}

@router.get("/{session_id}/agent-8/result")
async def agent8_result(session_id: str, db: Session = Depends(get_db)):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent8_state_json:
        raise HTTPException(status_code=404, detail="Agent 8 state not found.")
        
    return json.loads(session.agent8_state_json)

@router.get("/{session_id}/agent-8/download")
async def agent8_download(session_id: str, format: str = "md", db: Session = Depends(get_db)):
    from fastapi.responses import PlainTextResponse, StreamingResponse
    
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent8_state_json:
        raise HTTPException(status_code=404, detail="Agent 8 state not found.")
        
    state = json.loads(session.agent8_state_json)
    filename_base = f"DataLens_AI_Report_{session_id[:8]}"
    
    try:
        if format == "pptx":
            from app.tools.agent8_ppt import generate_pptx
            ppt_io = generate_pptx(state)
            headers = {"Content-Disposition": f"attachment; filename={filename_base}.pptx"}
            return StreamingResponse(ppt_io, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", headers=headers)
            
        elif format == "pdf":
            from app.tools.agent8_pdf import generate_pdf
            pdf_io = generate_pdf(state)
            headers = {"Content-Disposition": f"attachment; filename={filename_base}.pdf"}
            return StreamingResponse(pdf_io, media_type="application/pdf", headers=headers)
            
        elif format == "csv":
            from app.tools.agent8_csv import generate_csv
            csv_str = generate_csv(state)
            headers = {"Content-Disposition": f"attachment; filename={filename_base}.csv"}
            return PlainTextResponse(content=csv_str, media_type="text/csv", headers=headers)
            
        else:
            from app.tools.report_generator import generate_markdown_report
            markdown_content = generate_markdown_report(state)
            headers = {"Content-Disposition": f"attachment; filename={filename_base}.md"}
            return PlainTextResponse(content=markdown_content, headers=headers)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate {format.upper()} report: {str(e)}")

class Agent8ChatRequest(BaseModel):
    message: str

@router.post("/{session_id}/agent-8/chat")
def agent8_chat(session_id: str, request: Agent8ChatRequest, db: Session = Depends(get_db)):
    import httpx
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session or not session.agent8_state_json:
        raise HTTPException(status_code=404, detail="Agent 8 state not found.")
        
    state = json.loads(session.agent8_state_json)
    
    # Initialize custom_slides if missing
    if "custom_slides" not in state:
        state["custom_slides"] = []
        
    system_prompt = """You are DataLens AI, a specialized data analytics assistant. 
The user is asking you to generate a new slide for their final PowerPoint report based on the dataset you just analyzed.
You must output a JSON object representing the slide.

EXPECTED JSON SCHEMA:
{
  "title": "A short, punchy slide title",
  "content": ["Bullet point 1", "Bullet point 2"]
}
"""
    
    from app.tools.llm_client import call_llm_sync, is_llm_available

    try:
        if not is_llm_available():
            raise HTTPException(status_code=500, detail="No LLM API keys configured (Mistral/Groq).")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"User Request: {request.message}\nGenerate the slide JSON now."}
        ]
        
        content = call_llm_sync(
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"},
            timeout=30.0
        )
        parsed_slide = json.loads(content)
        
        # Append the slide
        state["custom_slides"].append(parsed_slide)
        
        # Save to DB
        session.agent8_state_json = json.dumps(state)
        db.commit()
        
        return {"status": "success", "new_slide": parsed_slide, "custom_slides_count": len(state["custom_slides"])}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Chat failed: {str(e)}")
