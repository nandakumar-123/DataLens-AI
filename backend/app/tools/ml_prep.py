import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

def analyze_ml_potential(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes the dataframe to extract metadata for ML recommendation.
    """
    cols = df.columns.tolist()
    metadata = {
        "rows": len(df),
        "columns": cols,
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "unique_counts": {col: df[col].nunique() for col in cols},
        "missing_counts": {col: int(df[col].isna().sum()) for col in cols}
    }
    
    # Heuristics for possible targets
    possible_targets = []
    id_columns = []
    
    for col in cols:
        unique_val = metadata["unique_counts"][col]
        # If unique values == rows, it's likely an ID
        if unique_val == len(df):
            id_columns.append(col)
        # If categorical and low cardinality (2 to 20), possible classification target
        elif 1 < unique_val <= 20:
            possible_targets.append(col)
        # If numeric and not uniform, possible regression target
        elif pd.api.types.is_numeric_dtype(df[col]) and unique_val > 20:
            possible_targets.append(col)
            
    metadata["possible_targets"] = possible_targets
    metadata["id_columns"] = id_columns
    
    return metadata

def validate_xy(df: pd.DataFrame, target: str, features: List[str]) -> Tuple[bool, str]:
    if not target:
        return False, "Target (Y) cannot be empty."
    if target not in df.columns:
        return False, f"Target '{target}' not found in dataset."
    if not features:
        return False, "At least one feature (X) must be selected."
    if target in features:
        return False, "Target column cannot also be selected as a feature."
        
    for f in features:
        if f not in df.columns:
            return False, f"Feature '{f}' not found in dataset."
            
    if df[target].isna().all():
        return False, "Target column contains only missing values."
        
    if df[target].nunique() < 2:
        return False, "Target column must have at least 2 unique values for Supervised learning."
        
    return True, "Valid"

def check_imbalance(df: pd.DataFrame, target: str) -> Dict[str, Any]:
    """
    Checks class imbalance if the target is categorical or low cardinality.
    """
    if pd.api.types.is_numeric_dtype(df[target]) and df[target].nunique() > 20:
        return {"detected": False, "reason": "Regression target"}
        
    counts = df[target].value_counts(normalize=True)
    if counts.empty:
        return {"detected": False, "reason": "No valid data"}
        
    min_class_ratio = counts.min()
    
    if min_class_ratio < 0.20:
        return {
            "detected": True,
            "reason": f"Class imbalance detected. Minority class is only {min_class_ratio*100:.1f}% of the data.",
            "distribution": counts.to_dict()
        }
        
    return {"detected": False, "reason": "Classes are relatively balanced."}

def detect_leakage(df: pd.DataFrame, target: str, features: List[str]) -> List[Dict[str, str]]:
    """
    Detects potential data leakage (e.g. features highly correlated with target).
    """
    warnings = []
    
    if pd.api.types.is_numeric_dtype(df[target]):
        # Check correlations
        for f in features:
            if pd.api.types.is_numeric_dtype(df[f]):
                # compute correlation
                corr = df[target].corr(df[f])
                if abs(corr) > 0.95:
                    warnings.append({
                        "feature": f,
                        "reason": f"Extremely high correlation ({corr:.2f}) with target. This may be a target-derived feature causing data leakage."
                    })
                    
    return warnings

def recommend_preprocessing(df: pd.DataFrame, features: List[str]) -> Dict[str, Any]:
    numeric_features = []
    categorical_features = []
    
    for f in features:
        if pd.api.types.is_numeric_dtype(df[f]):
            numeric_features.append(f)
        else:
            categorical_features.append(f)
            
    return {
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "numeric_imputer": "mean",
        "numeric_scaler": "StandardScaler",
        "categorical_imputer": "most_frequent",
        "categorical_encoder": "OneHotEncoder"
    }
