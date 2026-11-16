import pandas as pd
import os
import uuid
from typing import Dict, Any, List

def execute_join(plan: Dict[str, Any], datasets_map: Dict[str, str], output_dir: str) -> Dict[str, Any]:
    """
    Executes a deterministic pandas join based on the provided plan.
    Validates the plan, loads the datasets, performs the join, and saves the output.
    
    plan format: {
        "left": "customers.csv",
        "right": "orders.csv",
        "key": "customer_id",
        "type": "LEFT" # or INNER, RIGHT, OUTER
    }
    """
    left_name = plan.get("left")
    right_name = plan.get("right")
    left_key = plan.get("left_key")
    right_key = plan.get("right_key")
    join_type = plan.get("type", "LEFT").lower()
    
    if join_type not in ["inner", "left", "right", "outer"]:
        raise ValueError(f"Unsupported join type: {join_type}")
        
    if not left_name or not right_name or not left_key or not right_key:
        raise ValueError("Join plan must specify left dataset, right dataset, left key, and right key.")
        
    if left_name not in datasets_map or right_name not in datasets_map:
        raise ValueError(f"One or both datasets not found in active session: {left_name}, {right_name}")
        
    # Helper to load DF
    def load_df(name: str) -> pd.DataFrame:
        path = datasets_map[name]
        ext = os.path.splitext(path)[1].lower()
        if ext == '.csv':
            return pd.read_csv(path, low_memory=False)
        elif ext in ['.xlsx', '.xls']:
            return pd.read_excel(path)
        raise ValueError(f"Unsupported extension for {name} ({ext})")

    try:
        df_left = load_df(left_name)
        df_right = load_df(right_name)
    except Exception as e:
        raise RuntimeError(f"Failed to load datasets for combination: {str(e)}")

    if left_key not in df_left.columns:
        raise ValueError(f"Join key '{left_key}' not found in left dataset ({left_name})")
    if right_key not in df_right.columns:
        raise ValueError(f"Join key '{right_key}' not found in right dataset ({right_name})")

    # Validations before join
    
    # Check nulls
    left_nulls = df_left[left_key].isna().sum()
    if left_nulls == len(df_left):
        raise ValueError(f"Join key '{left_key}' is entirely null in {left_name}.")
        
    right_nulls = df_right[right_key].isna().sum()
    if right_nulls == len(df_right):
        raise ValueError(f"Join key '{right_key}' is entirely null in {right_name}.")
        
    # Check data type match
    if df_left[left_key].dtype.kind != df_right[right_key].dtype.kind:
        # Attempt safe coercion to string to allow joins across int/string IDs
        try:
            df_left[left_key] = df_left[left_key].astype(str)
            df_right[right_key] = df_right[right_key].astype(str)
            # Remove trailing .0 from floats coerced to string
            df_left[left_key] = df_left[left_key].str.replace(r'\.0$', '', regex=True)
            df_right[right_key] = df_right[right_key].str.replace(r'\.0$', '', regex=True)
        except Exception:
            raise ValueError(f"Incompatible data types for join keys and safe coercion failed: {df_left[left_key].dtype} vs {df_right[right_key].dtype}")
            
    # Check for overlapping values
    s1 = df_left[left_key].dropna()
    s2 = df_right[right_key].dropna()
    set1 = set(s1.unique())
    set2 = set(s2.unique())
    
    if len(set1) > 0 and len(set2) > 0:
        intersection = set1.intersection(set2)
        match_percentage = len(intersection) / len(set1) * 100
        if len(intersection) == 0:
            raise ValueError(f"No matching records: 0% overlapping values for keys '{left_key}' and '{right_key}'.")
            
        # Warn if very low match rate (< 5%) on INNER join, but we'll let it pass if explicitly requested,
        # or maybe we should raise if it's strictly an automated step? 
        # For now, we allow it but a real strict system might flag it.
            
    # Estimate row expansion (Many-to-Many check)
    left_counts = s1.value_counts()
    right_counts = s2.value_counts()
    
    # If there are duplicates in both, it's many-to-many
    if (left_counts > 1).any() and (right_counts > 1).any():
        # Estimate max rows
        max_possible = len(df_left) * len(df_right)
        # Just a rough heuristic to prevent massive explosions
        estimated_rows = sum((left_counts.get(k, 0) * right_counts.get(k, 0)) for k in intersection)
        
        # Add unmatched from left if LEFT JOIN
        if join_type in ['left', 'outer']:
            estimated_rows += sum(left_counts.get(k, 0) for k in set1 - intersection)
        if join_type in ['right', 'outer']:
            estimated_rows += sum(right_counts.get(k, 0) for k in set2 - intersection)
            
        if estimated_rows > len(df_left) * 10:
            raise ValueError(f"Unexpected Row Expansion: Join would expand {len(df_left)} rows to approx {estimated_rows} rows due to many-to-many relationships.")

    # Perform the join
    try:
        combined_df = pd.merge(
            df_left, 
            df_right, 
            left_on=left_key, 
            right_on=right_key, 
            how=join_type,
            suffixes=('_left', '_right')
        )
    except Exception as e:
        raise RuntimeError(f"Join execution failed: {str(e)}")
        
    # Calculate stats
    left_rows = len(df_left)
    right_rows = len(df_right)
    result_rows = len(combined_df)
    result_cols = len(combined_df.columns)
    
    # Calculate matched/unmatched
    actual_right_key = right_key if left_key != right_key else right_key + '_right'
    right_only_cols = [c for c in df_right.columns if c != right_key]
    matched_rows = 0
    if right_only_cols:
        col_to_check = right_only_cols[0]
        if col_to_check in df_left.columns:
            col_to_check += '_right'
        if col_to_check in combined_df.columns:
            matched_rows = combined_df[col_to_check].notna().sum()
            
    unmatched_rows = result_rows - matched_rows

    # Save to file
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    out_filename = f"combined_{uuid.uuid4().hex}.csv"
    out_path = os.path.join(output_dir, out_filename)
    
    try:
        combined_df.to_csv(out_path, index=False)
    except Exception as e:
        raise RuntimeError(f"Failed to save combined dataset: {str(e)}")
        
    return {
        "status": "success",
        "result_path": out_path,
        "preview": combined_df.head(50).fillna("").to_dict(orient="records"),
        "stats": {
            "left_rows": left_rows,
            "right_rows": right_rows,
            "result_rows": result_rows,
            "result_cols": result_cols,
            "matched_rows": int(matched_rows),
            "unmatched_rows": int(unmatched_rows)
        }
    }


def execute_concatenate(plan: Dict[str, Any], datasets_map: Dict[str, str], output_dir: str) -> Dict[str, Any]:
    """
    Executes a row-wise concatenation of datasets based on the provided plan.
    Validates types, performs safe normalization, and checks for duplicate rows.
    
    plan format: {
        "datasets": ["cleaned_merged_heart_dataset.csv", "raw_merged_heart_dataset.csv"]
    }
    """
    dataset_names = plan.get("datasets", [])
    if len(dataset_names) < 2:
        raise ValueError("Concatenation requires at least two datasets.")
        
    for name in dataset_names:
        if name not in datasets_map:
            raise ValueError(f"Dataset not found in active session: {name}")
            
    # Helper to load DF
    def load_df(name: str) -> pd.DataFrame:
        path = datasets_map[name]
        ext = os.path.splitext(path)[1].lower()
        if ext == '.csv':
            return pd.read_csv(path, low_memory=False)
        elif ext in ['.xlsx', '.xls']:
            return pd.read_excel(path)
        raise ValueError(f"Unsupported extension for {name} ({ext})")

    try:
        dfs = {name: load_df(name) for name in dataset_names}
    except Exception as e:
        raise RuntimeError(f"Failed to load datasets for concatenation: {str(e)}")

    base_name = dataset_names[0]
    base_df = dfs[base_name]
    base_cols = set(base_df.columns)
    
    # Validation & Normalization
    normalization_log = []
    
    for name in dataset_names[1:]:
        df = dfs[name]
        common_cols = base_cols.intersection(df.columns)
        
        for col in common_cols:
            if base_df[col].dtype.kind != df[col].dtype.kind:
                # Try to normalize if one is object/string and the other is numeric
                try:
                    if pd.api.types.is_numeric_dtype(base_df[col]):
                        dfs[name][col] = pd.to_numeric(df[col], errors='raise')
                        normalization_log.append(f"Normalized '{col}' in {name} to numeric to match {base_name}.")
                    elif pd.api.types.is_numeric_dtype(df[col]):
                        dfs[base_name][col] = pd.to_numeric(base_df[col], errors='raise')
                        normalization_log.append(f"Normalized '{col}' in {base_name} to numeric to match {name}.")
                    else:
                        raise ValueError(f"Incompatible types")
                except Exception:
                    raise ValueError(f"Concatenation blocked: Column '{col}' has incompatible types ({base_df[col].dtype} vs {df[col].dtype}) that cannot safely be converted.")

    # Execute concatenation
    try:
        combined_df = pd.concat(list(dfs.values()), ignore_index=True)
    except Exception as e:
        raise RuntimeError(f"Concatenation execution failed: {str(e)}")
        
    total_input_rows = sum(len(df) for df in dfs.values())
    
    # Check for duplicate rows
    initial_rows = len(combined_df)
    duplicates = combined_df.duplicated().sum()
    
    # We do NOT silently remove duplicates, but we return the count to inform the user
    
    # Save to file
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    out_filename = f"concatenated_{uuid.uuid4().hex}.csv"
    out_path = os.path.join(output_dir, out_filename)
    
    try:
        combined_df.to_csv(out_path, index=False)
    except Exception as e:
        raise RuntimeError(f"Failed to save concatenated dataset: {str(e)}")
        
    return {
        "status": "success",
        "result_path": out_path,
        "preview": combined_df.head(50).fillna("").to_dict(orient="records"),
        "stats": {
            "total_input_rows": total_input_rows,
            "result_rows": initial_rows,
            "result_cols": len(combined_df.columns),
            "duplicates_found": int(duplicates),
            "normalization_log": normalization_log
        }
    }
