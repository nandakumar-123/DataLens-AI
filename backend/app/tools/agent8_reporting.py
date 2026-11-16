import os
import json
import httpx
import math
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.config.config import settings

def clean_json_values(obj: Any) -> Any:
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: clean_json_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json_values(v) for v in obj]
    return obj

def truncate_for_prompt(data: Any, max_len: int = 1500) -> str:
    s = str(data)
    if len(s) > max_len:
        return s[:max_len] + "... (truncated)"
    return s

def classify_dataset(df: pd.DataFrame) -> str:
    """Detect if dataset is business/sales or general."""
    cols = [c.lower() for c in df.columns]
    business_keywords = ['sales', 'revenue', 'price', 'order', 'quantity', 'customer', 'product', 'region', 'invoice']
    matches = sum(1 for k in business_keywords if any(k in c for c in cols))
    return "business" if matches >= 3 else "general"

def generate_chart_data(df: pd.DataFrame, dataset_type: str) -> List[Dict[str, Any]]:
    charts = []
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    # Simple heuristic to find a date column
    date_col = None
    for col in df.columns:
        if 'date' in col.lower() or 'time' in col.lower():
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                date_col = col
                break
            else:
                try:
                    pd.to_datetime(df[col], errors='raise')
                    date_col = col
                    break
                except:
                    pass

    sales_col = None
    for col in num_cols:
        if 'sales' in col.lower() or 'revenue' in col.lower():
            sales_col = col
            break
            
    primary_metric = sales_col if sales_col else (num_cols[0] if num_cols else None)
    
    # 1. Line Chart (Time Series)
    if date_col and primary_metric:
        try:
            df[date_col] = pd.to_datetime(df[date_col])
            trend = df.groupby(df[date_col].dt.to_period("M"))[primary_metric].sum().reset_index()
            trend[date_col] = trend[date_col].astype(str)
            charts.append({
                "type": "line",
                "title": f"{primary_metric} Trend Over Time",
                "x_axis": date_col,
                "y_axis": primary_metric,
                "data": trend.head(20).to_dict(orient="records")
            })
        except:
            pass

    # 2. Bar Charts (Top Categories)
    for cat in cat_cols[:2]:  # Pick first two categorical columns
        if primary_metric and df[cat].nunique() < 20:
            agg = df.groupby(cat)[primary_metric].sum().reset_index().sort_values(by=primary_metric, ascending=False).head(10)
            charts.append({
                "type": "bar",
                "title": f"Top 10 {cat} by {primary_metric}",
                "x_axis": cat,
                "y_axis": primary_metric,
                "data": agg.to_dict(orient="records")
            })

    # 3. Scatter Plot (Correlation)
    if len(num_cols) >= 2:
        charts.append({
            "type": "scatter",
            "title": f"{num_cols[0]} vs {num_cols[1]}",
            "x_axis": num_cols[0],
            "y_axis": num_cols[1],
            "data": df[[num_cols[0], num_cols[1]]].dropna().head(100).to_dict(orient="records")
        })
        
    return charts

def calculate_kpis(df: pd.DataFrame, dataset_type: str) -> List[Dict[str, Any]]:
    kpis = []
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    kpis.append({"name": "Total Rows", "value": f"{len(df):,}"})
    
    if dataset_type == "business":
        for col in num_cols:
            cl = col.lower()
            if 'sales' in cl or 'revenue' in cl:
                kpis.append({"name": f"Total {col}", "value": f"${df[col].sum():,.2f}"})
                kpis.append({"name": f"Avg {col}", "value": f"${df[col].mean():,.2f}"})
            elif 'quantity' in cl or 'qty' in cl:
                kpis.append({"name": f"Total {col}", "value": f"{df[col].sum():,.0f}"})
            elif 'price' in cl:
                kpis.append({"name": f"Avg {col}", "value": f"${df[col].mean():,.2f}"})
    else:
        for col in num_cols[:3]: # First 3 numeric columns
            kpis.append({"name": f"Avg {col}", "value": f"{df[col].mean():,.2f}"})
            
    # Distinct categories
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    for col in cat_cols:
        cl = col.lower()
        if 'customer' in cl or 'client' in cl:
            kpis.append({"name": f"Unique Customers", "value": f"{df[col].nunique():,}"})
        if 'product' in cl or 'item' in cl:
            kpis.append({"name": f"Unique Products", "value": f"{df[col].nunique():,}"})
            
    # Deduplicate by name
    seen = set()
    unique_kpis = []
    for k in kpis:
        if k["name"] not in seen:
            seen.add(k["name"])
            unique_kpis.append(k)
            
    return unique_kpis[:6] # Max 6 KPIs

def generate_agent8_report_data(session_data: Dict[str, Any]) -> Dict[str, Any]:
    dataset_path = session_data.get("dataset_path")
    
    # Load dataset
    df = pd.DataFrame()
    if dataset_path and os.path.exists(dataset_path):
        try:
            df = pd.read_csv(dataset_path)
        except:
            pass
            
    dataset_type = classify_dataset(df) if not df.empty else "general"
    kpis = calculate_kpis(df, dataset_type) if not df.empty else []
    charts = generate_chart_data(df, dataset_type) if not df.empty else []
    
    # Extract states
    a2_state = session_data.get("agent2_state", {})
    a4_state = session_data.get("agent4_state", {})
    a6_state = session_data.get("agent6_state", {})
    a7_state = session_data.get("agent7_state", {})
    
    data_quality = {
        "score_before": a2_state.get("score_before", "N/A"),
        "score_after": a2_state.get("score_after", "N/A"),
        "missing_handled": bool(a2_state.get("missing_summary")),
        "duplicates_handled": a2_state.get("duplicates_removed", 0) > 0
    }
    
    statistics = {
        "correlations": a4_state.get("correlations", [])
    }
    
    ml_results = {}
    if a6_state and a7_state:
        ml_results = {
            "requested": True,
            "target": a6_state.get("target"),
            "best_model": a7_state.get("best_model", {}).get("name", "N/A"),
            "cv_score": a7_state.get("best_model", {}).get("cv_score"),
            "train_score": a7_state.get("best_model", {}).get("main_score"),
            "status": a7_state.get("best_model", {}).get("status", "Unknown"),
            "feature_importance": a7_state.get("best_model", {}).get("feature_importance", {})
        }
    else:
        ml_results = {"requested": False}

    raw_data = {
        "dataset_type": dataset_type,
        "kpis": kpis,
        "charts": charts,
        "data_quality": data_quality,
        "statistics": statistics,
        "ml_results": ml_results
    }
    
    system_prompt = f"""You are DataLens AI Agent 8, an expert data scientist and reporting AI.
Your job is to generate a final summary and actionable insights based EXCLUSIVELY on the provided computed results.
Dataset Type Detected: {dataset_type.upper()} ANALYTICS

CRITICAL RULES:
- Never invent statistics, ML scores, correlations, p-values, or feature importance.
- If ML was not requested, do not invent ML insights.
- Output ONLY valid JSON matching the schema below.

EXPECTED JSON SCHEMA:
{{
  "executive_summary": "A 2-paragraph high-level summary of the dataset and main findings.",
  "key_findings": ["finding 1 (include numbers if available)", "finding 2"],
  "data_quality_insights": ["insight 1"],
  "statistical_insights": ["insight 1"],
  "ml_insights": ["insight 1"],
  "recommendations": ["recommendation 1"],
  "conclusion": "A concise final conclusion."
}}
"""
    
    prompt_payload = f"""
KPIs:
{truncate_for_prompt(kpis, 1000)}

Charts Generated (summarized):
{truncate_for_prompt([{"title": c["title"], "type": c["type"]} for c in charts], 1000)}

Data Quality:
{truncate_for_prompt(data_quality, 500)}

Statistics (Correlations):
{truncate_for_prompt(statistics, 1000)}

ML Results:
{truncate_for_prompt(ml_results, 1000)}

Generate the JSON insights now.
"""
    
    ai_insights = {
        "executive_summary": "AI explanation is currently unavailable.",
        "key_findings": [],
        "data_quality_insights": [],
        "statistical_insights": [],
        "ml_insights": [],
        "recommendations": [],
        "conclusion": "AI explanation is currently unavailable."
    }

    from app.tools.llm_client import call_llm_sync, is_llm_available

    if is_llm_available():
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt_payload}
            ]
            content = call_llm_sync(
                messages=messages,
                temperature=0.0,
                response_format={"type": "json_object"},
                timeout=30.0
            )
            parsed_insights = json.loads(content)
            ai_insights.update(parsed_insights)
        except Exception as e:
            print(f"Agent 8 LLM API Error: {e}")
            
    final_state = {
        "raw_data": clean_json_values(raw_data),
        "ai_insights": ai_insights
    }
    
    return final_state
