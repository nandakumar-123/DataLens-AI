import pandas as pd
import numpy as np
import os
from typing import Dict, Any, List

def profile_dataset(file_path: str, original_filename: str) -> Dict[str, Any]:
    """
    Deterministically profiles a dataset using pandas.
    Extracts row counts, columns, types, missing values, duplicates, and basic stats.
    """
    ext = os.path.splitext(original_filename)[1].lower()
    
    try:
        if ext == '.csv':
            df = pd.read_csv(file_path, low_memory=False)
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported extension for profiling: {ext}")
            
        row_count = len(df)
        col_count = len(df.columns)
        duplicate_count = int(df.duplicated().sum())
        
        columns_metadata = []
        num_cols = 0
        cat_cols = 0
        date_cols = 0
        
        for col in df.columns:
            col_data = df[col]
            dtype = str(col_data.dtype)
            
            missing_count = int(col_data.isna().sum())
            unique_count = int(col_data.nunique(dropna=True))
            
            # Simple heuristic for potential keys:
            # 1. High cardinality (high unique ratio)
            # 2. Integer or string type
            # 3. Contains 'id', 'key', 'uuid' in name
            unique_ratio = unique_count / row_count if row_count > 0 else 0
            is_possible_key = False
            
            if unique_ratio > 0.9 and ('id' in col.lower() or 'key' in col.lower() or 'uuid' in col.lower() or 'code' in col.lower()):
                is_possible_key = True
                
            # Classify type
            inferred_type = 'categorical'
            stats = {}
            
            if pd.api.types.is_numeric_dtype(col_data):
                inferred_type = 'numerical'
                num_cols += 1
                if row_count > missing_count:
                    stats = {
                        'min': float(col_data.min()) if not pd.isna(col_data.min()) else None,
                        'max': float(col_data.max()) if not pd.isna(col_data.max()) else None,
                        'mean': float(col_data.mean()) if not pd.isna(col_data.mean()) else None,
                        'median': float(col_data.median()) if not pd.isna(col_data.median()) else None,
                    }
            elif pd.api.types.is_datetime64_any_dtype(col_data):
                inferred_type = 'datetime'
                date_cols += 1
            else:
                inferred_type = 'categorical'
                cat_cols += 1
                
            columns_metadata.append({
                'name': col,
                'pandas_type': dtype,
                'inferred_type': inferred_type,
                'missing_count': missing_count,
                'unique_count': unique_count,
                'is_possible_key': is_possible_key,
                'stats': stats
            })
            
        result = {
            'filename': original_filename,
            'row_count': row_count,
            'col_count': col_count,
            'duplicate_count': duplicate_count,
            'numerical_columns': num_cols,
            'categorical_columns': cat_cols,
            'datetime_columns': date_cols,
            'columns': columns_metadata,
            'preview': df.head(2).to_dict(orient='records') if row_count > 0 else []
        }
        
        return sanitize_for_json(result)
        
    except Exception as e:
        raise RuntimeError(f"Failed to profile dataset {original_filename}: {str(e)}")

import math

def sanitize_for_json(obj: Any) -> Any:
    """
    Recursively sanitizes an object for JSON serialization,
    converting NaN/Infinity to None and NumPy scalars to Python native types.
    """
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list) or isinstance(obj, tuple):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif pd.isna(obj):
        return None
    elif hasattr(obj, 'item'):
        val = obj.item()
        if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
            return None
        return val
    return obj
