import pandas as pd
import numpy as np
import os
import uuid
from typing import Dict, Any, List

def analyze_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes data quality and computes a score (0 to 100).
    Returns detected issues (missing, duplicates, outliers, constant cols), total counts, and the score.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    
    if total_rows == 0:
        return {"score": 0, "issues": {}, "stats": {"rows": 0, "cols": total_cols}}
        
    # Missing values
    missing = df.isna().sum().to_dict()
    total_missing = int(sum(missing.values()))
    
    # Duplicates
    duplicate_rows = int(df.duplicated().sum())
    
    # Outliers and constant columns
    outliers_data = {}
    constant_columns = []
    
    for col in df.columns:
        # Check constant columns
        if df[col].nunique(dropna=True) <= 1:
            constant_columns.append(col)
            
        # Check outliers if numeric
        if pd.api.types.is_numeric_dtype(df[col]):
            series = pd.to_numeric(df[col], errors='coerce').dropna()
            if len(series) > 10:
                q1 = float(series.quantile(0.25))
                q3 = float(series.quantile(0.75))
                iqr = float(q3 - q1)
                
                if iqr > 0:
                    lower = q1 - 1.5 * iqr
                    upper = q3 + 1.5 * iqr
                    outliers_count = int(((series < lower) | (series > upper)).sum())
                    if outliers_count > 0:
                        outliers_data[col] = {
                            "method": "IQR",
                            "count": outliers_count,
                            "percentage": round((outliers_count / total_rows) * 100, 2),
                            "lower_bound": round(float(lower), 4),
                            "upper_bound": round(float(upper), 4)
                        }
                else:
                    mean = float(series.mean())
                    std = float(series.std())
                    if std > 0:
                        z_scores = (series - mean) / std
                        outliers_count = int((z_scores.abs() > 3).sum())
                        if outliers_count > 0:
                            outliers_data[col] = {
                                "method": "Z-score",
                                "count": outliers_count,
                                "percentage": round((outliers_count / total_rows) * 100, 2),
                                "mean": round(float(mean), 4),
                                "std": round(float(std), 4),
                                "lower_bound": round(float(mean - 3 * std), 4),
                                "upper_bound": round(float(mean + 3 * std), 4)
                            }
                            
    # Quality Score Calculation
    # Max 100
    # Penalty: 
    #   missingness: up to -30
    #   duplicates: up to -20
    #   outliers: up to -10
    #   constant columns: -5 each (up to -10)
    
    missing_ratio = total_missing / (total_rows * total_cols) if (total_rows * total_cols) > 0 else 0
    missing_penalty = min(30, missing_ratio * 100 * 2)
    
    dup_ratio = duplicate_rows / total_rows if total_rows > 0 else 0
    dup_penalty = min(20, dup_ratio * 100 * 2)
    
    total_outliers = sum(v["count"] for v in outliers_data.values())
    outlier_ratio = total_outliers / (total_rows * max(1, len(outliers_data))) if outliers_data else 0
    outlier_penalty = min(10, outlier_ratio * 100 * 2)
    
    constant_penalty = min(10, len(constant_columns) * 5)
    
    score = 100.0 - missing_penalty - dup_penalty - outlier_penalty - constant_penalty
    score = max(0.0, round(score, 2))
    
    issues = {
        "missing": {k: int(v) for k, v in missing.items() if v > 0},
        "total_missing": total_missing,
        "duplicates": duplicate_rows,
        "outliers": outliers_data,
        "constant_columns": constant_columns
    }
    
    return {
        "score": score,
        "issues": issues,
        "stats": {
            "rows": total_rows,
            "cols": total_cols
        }
    }

def apply_cleaning(df: pd.DataFrame, decisions: Dict[str, Any]) -> pd.DataFrame:
    """
    Applies the cleaning operations dictated by user decisions safely:
    - duplicates: "remove" | "keep"
    - missing: { col: "median" | "mean" | "mode" | "drop" }
    - outliers: { col: "cap" | "remove" | "keep" }
    """
    clean_df = df.copy()
    
    # 1. Deduplication
    if decisions.get("duplicates") == "remove":
        clean_df = clean_df.drop_duplicates()
        
    # 2. Missing Value Imputation / Drop
    missing_dec = decisions.get("missing", {})
    for col, method in missing_dec.items():
        if col in clean_df.columns:
            m = str(method).lower()
            if m == "mean":
                if pd.api.types.is_numeric_dtype(clean_df[col]):
                    mean_val = clean_df[col].mean()
                    clean_df[col] = clean_df[col].fillna(mean_val)
                elif not clean_df[col].mode().empty:
                    clean_df[col] = clean_df[col].fillna(clean_df[col].mode()[0])
            elif m == "median":
                if pd.api.types.is_numeric_dtype(clean_df[col]):
                    med_val = clean_df[col].median()
                    clean_df[col] = clean_df[col].fillna(med_val)
                elif not clean_df[col].mode().empty:
                    clean_df[col] = clean_df[col].fillna(clean_df[col].mode()[0])
            elif m == "mode":
                if not clean_df[col].mode().empty:
                    clean_df[col] = clean_df[col].fillna(clean_df[col].mode()[0])
            elif m == "drop":
                clean_df = clean_df.dropna(subset=[col])
                
    # 3. Outlier Handling (Cap / Remove)
    outlier_dec = decisions.get("outliers", {})
    for col, method in outlier_dec.items():
        m = str(method).lower()
        if col in clean_df.columns and pd.api.types.is_numeric_dtype(clean_df[col]):
            series = pd.to_numeric(clean_df[col], errors='coerce').dropna()
            if len(series) > 0:
                q1 = series.quantile(0.25)
                q3 = series.quantile(0.75)
                iqr = q3 - q1
                if iqr > 0:
                    lower = q1 - 1.5 * iqr
                    upper = q3 + 1.5 * iqr
                else:
                    mean = series.mean()
                    std = series.std()
                    if std > 0:
                        lower = mean - 3 * std
                        upper = mean + 3 * std
                    else:
                        lower = series.min()
                        upper = series.max()
                
                if m == "remove":
                    clean_df = clean_df[((clean_df[col] >= lower) & (clean_df[col] <= upper)) | clean_df[col].isna()]
                elif m == "cap":
                    clean_df[col] = np.clip(clean_df[col], lower, upper)

    return clean_df.reset_index(drop=True)
