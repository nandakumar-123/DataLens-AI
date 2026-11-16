import pandas as pd
from typing import List, Dict, Any
import os

def analyze_relationships(profiles: List[Dict[str, Any]], dataset_map: Dict[str, str] = None) -> List[Dict[str, Any]]:
    """
    Deterministically analyzes multiple dataset profiles for potential relationships (JOIN or CONCATENATE)
    by comparing column names, types, uniqueness, and actual value overlap if paths are provided.
    """
    if len(profiles) < 2:
        return []

    relationships = []
    
    # Load dataframes if we have paths to check overlap and types
    dfs = {}
    if dataset_map:
        for fname, path in dataset_map.items():
            if os.path.exists(path):
                dfs[fname] = pd.read_csv(path, low_memory=False)

    # Common columns that are NOT safe join keys
    WEAK_KEYS = {'age', 'sex', 'gender', 'status', 'date', 'time', 'year', 'month', 'day', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalachh', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target'}

    for i in range(len(profiles)):
        for j in range(i + 1, len(profiles)):
            ds1 = profiles[i]
            ds2 = profiles[j]
            
            ds1_cols = {c['name'].lower(): c for c in ds1['columns']}
            ds2_cols = {c['name'].lower(): c for c in ds2['columns']}
            
            # --- CONCATENATION CHECK ---
            common_cols = set(ds1_cols.keys()).intersection(set(ds2_cols.keys()))
            max_cols = max(len(ds1_cols), len(ds2_cols))
            schema_overlap = len(common_cols) / max_cols if max_cols > 0 else 0
            
            if schema_overlap > 0.6:  # High schema overlap -> candidate for CONCATENATE
                type_mismatches = []
                compatible = True
                for col in common_cols:
                    if ds1_cols[col]['inferred_type'] != ds2_cols[col]['inferred_type']:
                        type_mismatches.append(f"{col}: {ds1_cols[col]['inferred_type']} vs {ds2_cols[col]['inferred_type']}")
                
                relationships.append({
                    'left_dataset': ds1['filename'],
                    'right_dataset': ds2['filename'],
                    'combination_type': 'CONCATENATE',
                    'confidence': 'Strong' if schema_overlap > 0.8 else 'Medium',
                    'schema_overlap_pct': round(schema_overlap * 100, 1),
                    'common_columns': list(common_cols),
                    'type_mismatches': type_mismatches,
                    'evidence': [
                        f"Schemas share {len(common_cols)} columns ({round(schema_overlap * 100, 1)}% overlap).",
                        "Datasets likely represent rows of the same entity/type."
                    ]
                })
                # Skip join checking if they are the same table structure to prevent 'age = age'
                if schema_overlap > 0.8:
                    continue
            
            # --- JOIN CHECK ---
            for c1_name_lower, c1 in ds1_cols.items():
                for c2_name_lower, c2 in ds2_cols.items():
                    types_compatible = (c1['inferred_type'] == c2['inferred_type'])
                    if not types_compatible:
                        continue
                        
                    evidence = []
                    confidence = "Weak"
                    
                    if c1_name_lower == c2_name_lower:
                        evidence.append(f"Matching column name '{c1['name']}'")
                        confidence = "Medium"
                        
                    match_percentage = 0.0
                    overlap_info = ""
                    
                    if dfs and ds1['filename'] in dfs and ds2['filename'] in dfs:
                        df1 = dfs[ds1['filename']]
                        df2 = dfs[ds2['filename']]
                        
                        col1 = c1['name']
                        col2 = c2['name']
                        
                        if col1 in df1.columns and col2 in df2.columns:
                            s1 = df1[col1].dropna()
                            s2 = df2[col2].dropna()
                            
                            set1 = set(s1.unique())
                            set2 = set(s2.unique())
                            
                            if len(set1) > 0 and len(set2) > 0:
                                intersection = set1.intersection(set2)
                                match_percentage = len(intersection) / len(set1) * 100
                                
                                if match_percentage > 0:
                                    overlap_info = f"Match percentage (left to right): {match_percentage:.1f}%"
                                    evidence.append(overlap_info)
                                    if match_percentage > 80:
                                        confidence = "Strong"
                                    elif match_percentage > 20:
                                        confidence = "Medium"
                                    
                                    # Check for many-to-many
                                    is_unique1 = (len(s1) == len(set1))
                                    is_unique2 = (len(s2) == len(set2))
                                    
                                    if not is_unique1 and not is_unique2:
                                        evidence.append("WARNING: Join key is not unique in either dataset (Many-to-Many)")
                                        confidence = "Weak"
                    
                    # Refusal logic for weak keys unless they are highly unique IDs
                    is_weak_key = c1_name_lower in WEAK_KEYS or c2_name_lower in WEAK_KEYS
                    is_id_like = 'id' in c1_name_lower or 'key' in c1_name_lower or c1['is_possible_key'] or c2['is_possible_key']
                    
                    if is_weak_key and not is_id_like:
                        confidence = "None"
                        
                    if (c1_name_lower == c2_name_lower or match_percentage > 0) and confidence != "None":
                        if is_id_like:
                            evidence.append("High cardinality / key candidate in at least one dataset")
                            confidence = "Strong"
                                
                        relationships.append({
                            'left_dataset': ds1['filename'],
                            'right_dataset': ds2['filename'],
                            'combination_type': 'JOIN',
                            'left_column': c1['name'],
                            'right_column': c2['name'],
                            'confidence': confidence,
                            'evidence': evidence,
                            'match_percentage': match_percentage
                        })
                        
    return relationships
