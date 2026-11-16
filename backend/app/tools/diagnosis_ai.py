import json
import httpx
from typing import Dict, Any
from app.config.config import settings

DIAGNOSIS_PROMPT = """You are DataLens AI Agent 7 ML Diagnostician.
Your job is to analyze the training and cross-validation scores of a machine learning model, and recommend a strategy to improve it.

RULES:
1. Do NOT fabricate scores.
2. Recommend ONE action from the allowed list:
   - "reduce_complexity" (if overfitting)
   - "increase_complexity" (if underfitting)
   - "increase_regularization" (if overfitting / unstable)
   - "tune_learning_rate" (if poor generalization on boosting models)
   - "default_search" (if unsure or basic tuning is needed)

OUTPUT JSON SCHEMA:
{
    "action": "reduce_complexity",
    "reason": "Detailed reason based on the gap between Train and CV"
}
"""

def get_improvement_strategy(model_name: str, train_score: float, cv_score: float, problem_type: str, previous_attempts: int) -> Dict[str, str]:
    """Synchronous version for Optuna trial loops with Groq fallback."""
    from app.tools.llm_client import call_llm_sync, is_llm_available

    if not is_llm_available():
        return {"action": "default_search", "reason": "No LLM API keys configured (Mistral/Groq), using default search."}
        
    prompt = f"Model: {model_name}\nProblem: {problem_type}\nTrain Score: {train_score:.4f}\nCV Score: {cv_score:.4f}\nPrevious Attempts: {previous_attempts}\n"
    
    messages = [
        {"role": "system", "content": DIAGNOSIS_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    try:
        res_text = call_llm_sync(
            messages=messages,
            temperature=0.0,
            response_format={"type": "json_object"},
            timeout=15.0
        )
        return json.loads(res_text)
    except Exception as e:
        return {"action": "default_search", "reason": f"AI diagnosis failed: {str(e)}"}
