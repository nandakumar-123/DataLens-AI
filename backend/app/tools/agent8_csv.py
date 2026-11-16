import io
import csv
from typing import Dict, Any

def generate_csv(report_data: Dict[str, Any]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    
    raw_data = report_data.get("raw_data", {})
    insights = report_data.get("ai_insights", {})
    
    # 1. Executive Summary
    writer.writerow(["=== EXECUTIVE SUMMARY ==="])
    writer.writerow([insights.get("executive_summary", "")])
    writer.writerow([])
    
    # 2. KPIs
    writer.writerow(["=== KPIs ==="])
    kpis = raw_data.get("kpis", [])
    for kpi in kpis:
        writer.writerow([kpi["name"], kpi["value"]])
    writer.writerow([])
    
    # 3. Data Quality
    writer.writerow(["=== DATA QUALITY ==="])
    dq = raw_data.get("data_quality", {})
    writer.writerow(["Score Before", dq.get("score_before")])
    writer.writerow(["Score After", dq.get("score_after")])
    writer.writerow([])
    
    # 4. ML Results
    ml = raw_data.get("ml_results", {})
    if ml.get("requested"):
        writer.writerow(["=== MACHINE LEARNING ==="])
        writer.writerow(["Best Model", ml.get("best_model")])
        writer.writerow(["CV Score", ml.get("cv_score")])
        writer.writerow(["Train Score", ml.get("train_score")])
        writer.writerow([])
        
    # 5. Key Findings
    writer.writerow(["=== KEY FINDINGS ==="])
    for f in insights.get("key_findings", []):
        writer.writerow([f])
    writer.writerow([])
    
    # 6. Recommendations
    writer.writerow(["=== RECOMMENDATIONS ==="])
    for r in insights.get("recommendations", []):
        writer.writerow([r])
        
    return output.getvalue()
