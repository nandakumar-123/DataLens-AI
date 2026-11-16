import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Any, List, Tuple
import math

def calculate_descriptive_stats(df: pd.DataFrame, numeric_cols: List[str]) -> List[Dict[str, Any]]:
    results = []
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
            
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        
        stat = {
            "column": col,
            "count": int(series.count()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "mode": float(series.mode()[0]) if not series.mode().empty else None,
            "min": float(series.min()),
            "max": float(series.max()),
            "range": float(series.max() - series.min()),
            "variance": float(series.var()) if len(series) > 1 else 0.0,
            "std": float(series.std()) if len(series) > 1 else 0.0,
            "q1": q1,
            "q3": q3,
            "iqr": q3 - q1,
            "skewness": float(series.skew()) if len(series) > 2 else 0.0,
            "kurtosis": float(series.kurt()) if len(series) > 3 else 0.0,
        }
        results.append(stat)
    return results

def calculate_categorical_stats(df: pd.DataFrame, categorical_cols: List[str]) -> List[Dict[str, Any]]:
    results = []
    for col in categorical_cols:
        series = df[col]
        missing = int(series.isna().sum())
        valid_series = series.dropna()
        
        if len(valid_series) == 0:
            continue
            
        val_counts = valid_series.value_counts()
        most_frequent = val_counts.index[0] if not val_counts.empty else None
        freq = int(val_counts.iloc[0]) if not val_counts.empty else 0
        
        stat = {
            "column": col,
            "unique_values": int(valid_series.nunique()),
            "most_frequent": str(most_frequent) if most_frequent is not None else None,
            "frequency": freq,
            "percentage": round((freq / len(valid_series)) * 100, 2) if len(valid_series) > 0 else 0.0,
            "missing_values": missing
        }
        results.append(stat)
    return results

def calculate_correlations(df: pd.DataFrame, numeric_cols: List[str]) -> Dict[str, Any]:
    if len(numeric_cols) < 2:
        return {"matrix": [], "strongest_positive": [], "strongest_negative": []}
        
    df_num = df[numeric_cols].dropna()
    if len(df_num) < 3:
        return {"matrix": [], "strongest_positive": [], "strongest_negative": []}
        
    # Decide Pearson vs Spearman based on skewness
    # A simple heuristic: if max absolute skewness > 1, use spearman
    skewness = df_num.skew().abs().max()
    method = 'spearman' if skewness > 1 else 'pearson'
    
    corr_matrix = df_num.corr(method=method)
    
    # Format for heatmap (Plotly needs x, y, z arrays)
    z_values = corr_matrix.replace({np.nan: None}).values.tolist()
    
    # Extract strongest relationships
    pairs = []
    for i in range(len(numeric_cols)):
        for j in range(i+1, len(numeric_cols)):
            val = corr_matrix.iloc[i, j]
            if not pd.isna(val):
                pairs.append((numeric_cols[i], numeric_cols[j], float(val)))
                
    pairs.sort(key=lambda x: x[2], reverse=True)
    
    strongest_pos = [{"feature_a": p[0], "feature_b": p[1], "correlation": round(p[2], 3)} for p in pairs if p[2] > 0.5]
    strongest_neg = [{"feature_a": p[0], "feature_b": p[1], "correlation": round(p[2], 3)} for p in pairs if p[2] < -0.5]
    
    return {
        "method": method,
        "x": numeric_cols,
        "y": numeric_cols,
        "z": z_values,
        "strongest_positive": strongest_pos[:5],
        "strongest_negative": strongest_neg[::-1][:5]
    }

def run_hypothesis_tests(df: pd.DataFrame, numeric_cols: List[str], cat_cols: List[str], alpha: float = 0.05) -> List[Dict[str, Any]]:
    tests = []
    
    # Limit tests to avoid combinatorial explosion
    # 1. T-test / ANOVA (Numerical vs Categorical)
    for cat in cat_cols[:3]:  # Top 3 categorical to save time
        series = df[cat].dropna()
        unique_vals = series.unique()
        if len(unique_vals) == 2:
            # T-test
            group1 = unique_vals[0]
            group2 = unique_vals[1]
            for num in numeric_cols[:5]:
                g1_data = df[df[cat] == group1][num].dropna()
                g2_data = df[df[cat] == group2][num].dropna()
                if len(g1_data) >= 5 and len(g2_data) >= 5:
                    stat, p = stats.ttest_ind(g1_data, g2_data, equal_var=False)
                    if not pd.isna(p):
                        tests.append({
                            "test_name": "Independent t-test",
                            "variables": f"{num} by {cat}",
                            "groups": f"{group1} vs {group2}",
                            "statistic": round(float(stat), 4),
                            "p_value": float(p),
                            "significance_level": alpha,
                            "significant": bool(p < alpha),
                            "interpretation": "Statistically significant difference detected." if p < alpha else "Insufficient evidence of statistical significance."
                        })
        elif 2 < len(unique_vals) <= 5:
            # ANOVA
            for num in numeric_cols[:5]:
                groups = [df[df[cat] == g][num].dropna() for g in unique_vals]
                groups = [g for g in groups if len(g) >= 5]
                if len(groups) >= 2:
                    stat, p = stats.f_oneway(*groups)
                    if not pd.isna(p):
                        tests.append({
                            "test_name": "One-way ANOVA",
                            "variables": f"{num} by {cat}",
                            "groups": f"{len(groups)} groups",
                            "statistic": round(float(stat), 4),
                            "p_value": float(p),
                            "significance_level": alpha,
                            "significant": bool(p < alpha),
                            "interpretation": "Statistically significant difference detected across groups." if p < alpha else "Insufficient evidence of statistical significance."
                        })
                        
    # 2. Chi-square (Categorical vs Categorical)
    for i in range(min(3, len(cat_cols))):
        for j in range(i+1, min(4, len(cat_cols))):
            cat1 = cat_cols[i]
            cat2 = cat_cols[j]
            if df[cat1].nunique() <= 10 and df[cat2].nunique() <= 10:
                contingency = pd.crosstab(df[cat1], df[cat2])
                if contingency.size > 0:
                    stat, p, dof, expected = stats.chi2_contingency(contingency)
                    if not pd.isna(p):
                        tests.append({
                            "test_name": "Chi-square Test",
                            "variables": f"{cat1} × {cat2}",
                            "groups": "-",
                            "statistic": round(float(stat), 4),
                            "p_value": float(p),
                            "significance_level": alpha,
                            "significant": bool(p < alpha),
                            "interpretation": "Statistically significant association detected." if p < alpha else "Insufficient evidence of association."
                        })
                        
    # Only return top significant + a few non-significant to keep UI clean
    tests.sort(key=lambda x: x["p_value"])
    return tests[:15]
