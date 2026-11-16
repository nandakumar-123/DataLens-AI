import json
import re
from typing import Dict, Any
from app.config.config import settings

SYSTEM_PROMPT = """You are DataLens AI Agent 2: Data Quality & Cleaning Assistant.
Your job is to analyze data quality issues and generate safe cleaning recommendations.

Rules:
1. Never invent missing values, duplicate counts, or outlier statistics. Use ONLY the supplied report.
2. Recommend safe defaults (e.g., Median for skewed numeric missing values, Mode for categorical).
3. Do not recommend destructive actions automatically unless specified.
4. Output structured JSON matching the schema below.
5. Provide a short, user-friendly "ai_summary" explaining the quality state and your reasoning.

JSON Schema:
{
  "recommendations": {
    "missing": {
      "column_name": {"method": "median|mean|mode|drop", "reason": "why"}
    },
    "outliers": {
      "column_name": {"method": "keep|cap|remove", "reason": "why"}
    },
    "duplicates": {"method": "remove|keep", "reason": "why"}
  },
  "ai_summary": "Short explanation of the dataset's quality and recommended fixes."
}
"""

async def recommend_cleaning(quality_report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calls LLM (Mistral / Groq / Grok) to convert a quality report into a structured set of cleaning recommendations.
    """
    from app.tools.llm_client import call_llm_async, is_llm_available, clean_llm_output
    
    prompt = f"Quality Report:\n{json.dumps(quality_report, indent=2)}\n\nGenerate cleaning recommendations in JSON format."

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    try:
        if not is_llm_available():
            raise ValueError("No LLM API keys configured (Mistral/Groq/Grok).")
            
        result_text = await call_llm_async(
            messages=messages,
            temperature=0.0,
            response_format={"type": "json_object"},
            timeout=30.0
        )
        cleaned_text = clean_llm_output(result_text)
        result_json = json.loads(cleaned_text)
        
        # Ensure minimum schema structure
        if "recommendations" not in result_json:
            result_json["recommendations"] = {"missing": {}, "outliers": {}, "duplicates": {"method": "keep", "reason": ""}}
        if "ai_summary" not in result_json:
            result_json["ai_summary"] = "Data quality analyzed successfully."
            
        return result_json
            
    except Exception as e:
        # Deterministic fallback when LLM fails or keys unavailable
        recs = {
            "missing": {},
            "outliers": {},
            "duplicates": {"method": "keep", "reason": "Default fallback (AI unavailable)"}
        }
        
        issues = quality_report.get("issues", {})
        
        for col, count in issues.get("missing", {}).items():
            if col != "total_missing":
                recs["missing"][col] = {"method": "median", "reason": "Recommended robust fallback imputation"}
                
        for col, info in issues.get("outliers", {}).items():
            recs["outliers"][col] = {"method": "cap", "reason": "Recommended safe boundary capping"}
            
        if issues.get("duplicates", 0) > 0:
            recs["duplicates"] = {"method": "remove", "reason": "Recommended removing duplicate rows"}
            
        return {
            "recommendations": recs,
            "ai_summary": f"Using smart deterministic cleaning recommendations (LLM note: {str(e)})"
        }
