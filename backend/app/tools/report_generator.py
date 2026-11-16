from typing import Dict, Any

def generate_markdown_report(agent8_data: Dict[str, Any]) -> str:
    """
    Converts the Agent 8 result dictionary into a structured Markdown report.
    """
    raw_data = agent8_data.get("raw_data", {})
    insights = agent8_data.get("ai_insights", {})
    
    dataset_overview = raw_data.get("dataset_overview", {})
    data_quality = raw_data.get("data_quality", {})
    ml_results = raw_data.get("ml_results", {})
    
    md = []
    md.append("# DataLens AI — Final Analysis Report\n")
    
    # 1. Dataset Overview
    md.append("## 1. Dataset Overview\n")
    md.append(f"- **Rows**: {dataset_overview.get('rows', 'N/A')}")
    md.append(f"- **Columns**: {dataset_overview.get('columns', 'N/A')}")
    md.append(f"- **Numerical Columns**: {len(dataset_overview.get('numerical_columns', []))}")
    md.append(f"- **Categorical Columns**: {len(dataset_overview.get('categorical_columns', []))}\n")
    
    # 2. Data Quality
    md.append("## 2. Data Quality\n")
    md.append(f"- **Quality Score Before**: {data_quality.get('score_before', 'N/A')}")
    md.append(f"- **Quality Score After**: {data_quality.get('score_after', 'N/A')}")
    md.append(f"- **Missing Values Handled**: {'Yes' if data_quality.get('missing_values_handled') else 'No'}")
    md.append(f"- **Duplicates Removed**: {'Yes' if data_quality.get('duplicates_handled') else 'No'}\n")
    
    if insights.get("data_quality_insights"):
        md.append("### Quality Insights")
        for i in insights.get("data_quality_insights", []):
            md.append(f"- {i}")
        md.append("")
        
    # 3. Statistics
    md.append("## 3. Statistical Insights\n")
    if insights.get("statistical_insights"):
        for i in insights.get("statistical_insights", []):
            md.append(f"- {i}")
    else:
        md.append("No statistical insights generated.")
    md.append("")
    
    # 4. ML Results
    md.append("## 4. Machine Learning\n")
    if ml_results.get("requested"):
        md.append(f"- **Learning Type**: {ml_results.get('learning_type', 'N/A').title()}")
        md.append(f"- **Problem Type**: {ml_results.get('problem_type', 'N/A').title()}")
        md.append(f"- **Target**: {ml_results.get('target', 'N/A')}")
        md.append(f"- **Best Model**: {ml_results.get('best_model', 'N/A')}")
        md.append(f"- **CV Score**: {ml_results.get('cv_score', 'N/A')}")
        md.append(f"- **Training Score**: {ml_results.get('train_score', 'N/A')}")
        md.append(f"- **Status**: {ml_results.get('status', 'N/A')}\n")
        
        if insights.get("ml_insights"):
            md.append("### ML Insights")
            for i in insights.get("ml_insights", []):
                md.append(f"- {i}")
            md.append("")
    else:
        md.append("*ML Analysis: Not Requested*\n")
        
    # 5. Key Findings & Recommendations
    md.append("## 5. Key Findings & Recommendations\n")
    if insights.get("key_findings"):
        md.append("### Key Findings")
        for i in insights.get("key_findings", []):
            md.append(f"- {i}")
        md.append("")
        
    if insights.get("recommendations"):
        md.append("### Recommendations")
        for i in insights.get("recommendations", []):
            md.append(f"- {i}")
        md.append("")
        
    # 6. Conclusion
    md.append("## 6. Final Conclusion\n")
    md.append(f"{insights.get('conclusion', 'No conclusion generated.')}\n")
    
    return "\n".join(md)
