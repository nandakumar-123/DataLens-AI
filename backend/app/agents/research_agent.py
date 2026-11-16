import json
import httpx
from typing import Dict, Any

from app.config.config import settings

SYSTEM_PROMPT = """You are DataLens AI Agent 4 (Statistics & Research).
Your job is to interpret statistical results provided to you.
1. NEVER invent, hallucinate, or recalculate numerical values.
2. Use ONLY the computed statistics provided in the context.
3. Keep interpretations concise, professional, and accessible.
4. If asked a question that cannot be answered by the provided statistics, state that clearly.
5. Use phrases like "Evidence suggests" rather than "Proves" for statistical tests.
6. FORMATTING: Structure your response cleanly. Use short paragraphs, clear spacing, and plain-text bullet points (using hyphens). Do NOT use markdown symbols like **asterisks** for bolding, as the UI renders raw text.
"""

async def generate_statistical_summary(stats: Dict[str, Any]) -> str:
    """
    Generates a natural language summary of the computed statistics.
    """
    from app.tools.llm_client import call_llm_async, is_llm_available

    if not is_llm_available():
        return "No LLM API keys configured (Mistral/Groq). Statistical summary is unavailable."
        
    prompt = "Please provide a brief, professional summary of these statistical findings. Highlight the most interesting correlations, significant test results, and any notable distribution characteristics. Do not invent any numbers.\n\n"
    
    context = {
        "strongest_positive_correlations": stats.get("correlations", {}).get("strongest_positive", []),
        "strongest_negative_correlations": stats.get("correlations", {}).get("strongest_negative", []),
        "significant_tests": [t for t in stats.get("hypothesis_tests", []) if t.get("significant")],
        "dataset_rows": stats.get("rows"),
    }
    
    prompt += json.dumps(context, indent=2)
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    try:
        return await call_llm_async(
            messages=messages,
            temperature=0.3,
            timeout=30.0
        )
    except Exception as e:
        return f"Failed to generate summary: {str(e)}"

async def answer_statistical_question(question: str, stats: Dict[str, Any]) -> str:
    """
    Answers an ad-hoc statistical question using the computed stats as context.
    """
    from app.tools.llm_client import call_llm_async, is_llm_available

    if not is_llm_available():
        return "No LLM API keys configured (Mistral/Groq). Cannot answer natural language queries."
        
    prompt = f"User Question: {question}\n\nContext Data (Use this to answer. Do not calculate on your own!):\n\n"
    
    context = {
        "descriptive_stats": stats.get("descriptive", []),
        "categorical_stats": stats.get("categorical", []),
        "correlations": {
            "strongest_positive": stats.get("correlations", {}).get("strongest_positive", []),
            "strongest_negative": stats.get("correlations", {}).get("strongest_negative", [])
        },
        "hypothesis_tests": stats.get("hypothesis_tests", [])
    }
    
    prompt += json.dumps(context, indent=2)
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    try:
        return await call_llm_async(
            messages=messages,
            temperature=0.1,
            timeout=30.0
        )
    except Exception as e:
        return f"Error: {str(e)}"
