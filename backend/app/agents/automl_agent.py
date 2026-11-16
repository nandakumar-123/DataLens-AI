import json
import httpx
from typing import Dict, Any, List

from app.config.config import settings

SYSTEM_PROMPT = """You are DataLens AI Agent 7 (AutoML & Model Selection).
Your job is to recommend appropriate machine learning models and explain training results.
1. NEVER invent, hallucinate, or recalculate numerical values or model metrics.
2. Use ONLY the supplied dataset metadata, features, target, and computed results.
3. Keep recommendations concise and professional.
4. Adhere STRICTLY to the learning type (Supervised vs Unsupervised) and problem type (Classification vs Regression). Do not recommend unsupervised algorithms for a supervised problem.
5. Provide responses formatted purely in plain-text markdown (no bolding asterisks or complex markdown that the UI cannot render cleanly).
"""

async def recommend_models(metadata: Dict[str, Any], learning_type: str, problem_type: str = None) -> List[Dict[str, str]]:
    """
    Recommends the 2 best models based on metadata.
    Returns a list of dicts: [{"name": "Random Forest", "reason": "..."}]
    """
    from app.tools.llm_client import call_llm_async, is_llm_available

    if not is_llm_available():
        # Deterministic fallback
        if learning_type == "supervised":
            if problem_type == "classification":
                return [
                    {"name": "XGBoost", "reason": "State-of-the-art gradient boosted decision trees with high accuracy on tabular data."},
                    {"name": "Random Forest", "reason": "Robust to overfitting and handles non-linear relationships well."},
                    {"name": "Logistic Regression", "reason": "A strong, interpretable baseline for classification."}
                ]
            else:
                return [
                    {"name": "XGBoost Regressor", "reason": "High-performance gradient boosted regression trees with superior predictive accuracy."},
                    {"name": "Random Forest Regressor", "reason": "Handles complex non-linear patterns without heavy tuning."},
                    {"name": "Linear Regression", "reason": "A fast, interpretable baseline regression model."}
                ]
        else:
            return [
                {"name": "K-Means", "reason": "A fast and widely used clustering algorithm."},
                {"name": "PCA", "reason": "Excellent for dimensionality reduction and visualizing data."}
            ]

    # Ask LLM for recommendation
    prompt = f"Learning Type: {learning_type}\n"
    if problem_type:
        prompt += f"Problem Type: {problem_type}\n"
    prompt += "Dataset Metadata:\n" + json.dumps({
        "rows": metadata.get("rows"),
        "columns": metadata.get("columns"),
        "features": metadata.get("features", []),
        "target": metadata.get("target", "None"),
        "has_imbalance": metadata.get("has_imbalance", False)
    }, indent=2)
    
    prompt += "\n\nPlease recommend exactly 2 appropriate models from the scikit-learn/xgboost ecosystem. "
    prompt += "Return the response strictly as a JSON array of objects with 'name' and 'reason' keys. Example:\n"
    prompt += '[{"name": "XGBoost", "reason": "Excellent performance on tabular data."}]'

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    try:
        content = await call_llm_async(
            messages=messages,
            temperature=0.1,
            response_format={"type": "json_object"},
            timeout=30.0
        )
        import re
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        return json.loads(content)
    except Exception as e:
        print(f"LLM recommendation failed: {e}")
        # Deterministic fallback
        if learning_type == "supervised":
            return [{"name": "Random Forest", "reason": "Fallback: Robust general-purpose model."}]
        return [{"name": "K-Means", "reason": "Fallback: General clustering algorithm."}]

def generate_deterministic_explanation(metrics_summary: Dict[str, Any]) -> str:
    models = metrics_summary.get("models", [])
    problem = metrics_summary.get("problem", "analysis")
    if not models:
        return "No models were evaluated."
        
    lines = [f"**AutoML Training & Model Fit Analysis ({problem.capitalize()})**:\n"]
    for m in models:
        name = m.get("name", "Model")
        train_sc = m.get("train_score", 0)
        cv_sc = m.get("cv_score", 0)
        status = m.get("status", "")
        
        train_str = f"{train_sc * 100:.1f}%" if isinstance(train_sc, (int, float)) and train_sc <= 1 else f"{train_sc:.3f}"
        cv_str = f"{cv_sc * 100:.1f}%" if isinstance(cv_sc, (int, float)) and cv_sc <= 1 and cv_sc > -900 else "N/A"
        
        if "Overfitting" in status:
            diag = f"**Overfitting Detected** — Train accuracy ({train_str}) is significantly higher than validation score ({cv_str}). The model memorized training patterns and may struggle on unseen data."
        elif "Underfitting" in status:
            diag = f"**Underfitting Detected** — Low score across both training ({train_str}) and validation ({cv_str}). The model is too simple or lacks predictive features."
        elif "Good" in status or "Excellent" in status:
            diag = f"**Good Generalization (Good Fit)** — Train accuracy ({train_str}) and CV score ({cv_str}) are well-aligned with minimal generalization gap."
        else:
            diag = f"**Fit Status**: {status} (Train: {train_str}, CV: {cv_str})"
            
        lines.append(f"- **{name}**: {diag}")
    return "\n\n".join(lines)

async def explain_results(metrics_summary: Dict[str, Any]) -> str:
    """
    Analyzes model metrics and explains overfitting, underfitting, or general performance.
    """
    from app.tools.llm_client import call_llm_async, is_llm_available

    if not is_llm_available():
        return generate_deterministic_explanation(metrics_summary)
        
    prompt = (
        "Please provide a final, professional assessment of these model training results.\n"
        "1. Clearly state the accuracy/performance score of each model.\n"
        "2. Explicitly diagnose each model as Overfitting, Underfitting, or Good Fit based on the training vs validation (CV) score gap.\n"
        "3. Identify the BEST model and justify why it was selected.\n"
        "Do NOT invent any numbers. Do NOT claim a model is good if its CV score is poor.\n\n"
    )
    prompt += json.dumps(metrics_summary, indent=2)
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    try:
        return await call_llm_async(
            messages=messages,
            temperature=0.2,
            timeout=30.0
        )
    except Exception as e:
        return generate_deterministic_explanation(metrics_summary)
