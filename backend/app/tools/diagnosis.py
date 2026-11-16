import optuna
import pandas as pd
import numpy as np
import time
from typing import Dict, Any, List, Tuple
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, KFold, cross_val_score
from app.tools.automl import evaluate_classification, evaluate_regression, get_model_instance, build_preprocessor

def check_data_leakage(df: pd.DataFrame, features: List[str], target: str) -> List[Dict[str, str]]:
    """
    Step 1: Check for potential data leakage by inspecting correlations with the target.
    Returns a list of warnings.
    """
    warnings = []
    if pd.api.types.is_numeric_dtype(df[target]):
        correlations = df[features + [target]].select_dtypes(include=[np.number]).corr()[target]
        for feature, corr_value in correlations.items():
            if feature == target:
                continue
            if abs(corr_value) > 0.98:
                warnings.append({
                    "feature": feature,
                    "reason": f"Extremely high correlation ({corr_value:.3f}) with target. This might be a target-derived feature or an identifier causing data leakage."
                })
    return warnings

def diagnose_status(train_score: float, cv_score: float, problem_type: str) -> str:
    """
    Detect Severe Overfitting, Underfitting, Good Fit, etc.
    """
    if cv_score < -1.0 and problem_type != "classification":
        return "Severe Overfitting / Poor Generalization"
    
    gap = train_score - cv_score
    if gap > 0.20:
        return "Severe Overfitting"
    elif gap > 0.08:
        return "Overfitting"
    elif train_score < 0.40 and cv_score < 0.40:
        return "Underfitting"
    elif train_score < 0.55:
        return "Possible Underfitting"
    elif cv_score >= 0.85:
        return "Excellent Fit"
    elif cv_score >= 0.60:
        return "Good Fit"
    return "Moderate Fit"

def train_and_evaluate(pipeline: Pipeline, X: pd.DataFrame, y: pd.Series, problem_type: str) -> Tuple[float, float, Dict[str, Any]]:
    """
    Properly evaluates a pipeline using CV (where preprocessing is fitted only on training folds), 
    then returns (train_score, cv_score, metrics).
    """
    # Cross Validation
    try:
        if problem_type == "classification":
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring='accuracy', n_jobs=-1, error_score='raise')
            cv_score = float(np.mean(cv_scores))
        else:
            cv = KFold(n_splits=5, shuffle=True, random_state=42)
            cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring='r2', n_jobs=-1, error_score='raise')
            cv_score = float(np.mean(cv_scores))
    except Exception as e:
        print(f"CV Failed: {e}")
        cv_score = -999.0

    # Full Training for evaluation
    pipeline.fit(X, y)
    y_pred = pipeline.predict(X)
    
    y_prob = None
    if problem_type == "classification" and hasattr(pipeline, "predict_proba"):
        try:
            y_prob = pipeline.predict_proba(X)
        except:
            pass

    if problem_type == "classification":
        metrics = evaluate_classification(y, y_pred, y_prob)
        main_score = metrics["accuracy"]
    else:
        metrics = evaluate_regression(y, y_pred)
        main_score = metrics["r2"]
        
    return main_score, cv_score, metrics

def improve_model(model_name: str, df: pd.DataFrame, features: List[str], target: str, problem_type: str, max_attempts: int = 3) -> List[Dict[str, Any]]:
    """
    Step 11: Attempt to improve the model up to max_attempts.
    Returns a history of attempts.
    """
    start_time = time.time()
    attempts = []
    
    X = df[features]
    y = df[target]
    valid_idx = y.notna()
    X = X[valid_idx]
    y = y[valid_idx]
    
    if problem_type == "classification":
        from sklearn.preprocessing import LabelEncoder
        y = LabelEncoder().fit_transform(y)
        
    preprocessor = build_preprocessor(df, features)
    
    # Check Leakage
    leakage_warnings = check_data_leakage(df, features, target)
    if leakage_warnings:
        print("Data Leakage Detected:", leakage_warnings)
    
    # ATTEMPT 0: Baseline
    base_model = get_model_instance(model_name)
    if base_model is None:
        raise ValueError(f"Model {model_name} not found or unsupported.")
        
    pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('model', base_model)])
    train_score, cv_score, metrics = train_and_evaluate(pipeline, X, y, problem_type)
    status = "⚠ Data Leakage Detected" if leakage_warnings else diagnose_status(train_score, cv_score, problem_type)
    
    attempts.append({
        "attempt": 0,
        "description": "Baseline",
        "train_score": train_score,
        "cv_score": cv_score,
        "status": status,
        "metrics": metrics,
        "pipeline": pipeline,
        "time": time.time() - start_time
    })
    
    # Optimization Loop
    current_best_cv = cv_score
    current_best_params = {}
    
    # Stop if Baseline is already Good or Excellent, or if there's leakage
    if "Good" in status or "Excellent" in status or "Leakage" in status:
        return attempts
        
    # We will try up to 3 rounds of optimization using Optuna + Mistral
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    
    from app.tools.diagnosis_ai import get_improvement_strategy
    
    for attempt_num in range(1, max_attempts + 1):
        # AI Strategy (synchronous call)
        strategy = get_improvement_strategy(model_name, train_score, current_best_cv, problem_type, attempt_num - 1)
        action = strategy.get("action", "default_search")
        reason = strategy.get("reason", "No reason provided")
        
        def objective(trial):
            params = {}
            if "XGBoost" in model_name:
                if action == "reduce_complexity":
                    params = {
                        "max_depth": trial.suggest_int("max_depth", 2, 4),
                        "n_estimators": trial.suggest_int("n_estimators", 30, 100),
                        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.1, log=True)
                    }
                elif action == "increase_regularization":
                    params = {
                        "max_depth": trial.suggest_int("max_depth", 3, 6),
                        "reg_alpha": trial.suggest_float("reg_alpha", 1.0, 10.0, log=True),
                        "reg_lambda": trial.suggest_float("reg_lambda", 1.0, 10.0, log=True)
                    }
                else: # default
                    params = {
                        "max_depth": trial.suggest_int("max_depth", 2, 8),
                        "learning_rate": trial.suggest_float("learning_rate", 1e-3, 0.3, log=True),
                        "n_estimators": trial.suggest_int("n_estimators", 50, 300)
                    }
            elif "Random Forest" in model_name:
                if action == "reduce_complexity":
                    params = {
                        "max_depth": trial.suggest_int("max_depth", 3, 8),
                        "min_samples_split": trial.suggest_int("min_samples_split", 5, 20),
                        "min_samples_leaf": trial.suggest_int("min_samples_leaf", 3, 10)
                    }
                else:
                    params = {
                        "max_depth": trial.suggest_int("max_depth", 3, 15),
                        "n_estimators": trial.suggest_int("n_estimators", 50, 200),
                        "min_samples_split": trial.suggest_int("min_samples_split", 2, 10)
                    }
            elif "LightGBM" in model_name:
                if action == "reduce_complexity":
                    params = {
                        "max_depth": trial.suggest_int("max_depth", 3, 6),
                        "num_leaves": trial.suggest_int("num_leaves", 10, 31),
                        "min_child_samples": trial.suggest_int("min_child_samples", 10, 50)
                    }
                else:
                    params = {
                        "max_depth": trial.suggest_int("max_depth", 3, 12),
                        "learning_rate": trial.suggest_float("learning_rate", 1e-3, 0.3, log=True),
                        "n_estimators": trial.suggest_int("n_estimators", 50, 200)
                    }
            else:
                raise optuna.TrialPruned()
                
            model_instance = get_model_instance(model_name)
            
            # Start from the best valid previous configuration, then override with new trial params
            full_params = current_best_params.copy()
            full_params.update(params)
            model_instance.set_params(**full_params)
            
            pl = Pipeline(steps=[('preprocessor', preprocessor), ('model', model_instance)])
            
            try:
                if problem_type == "classification":
                    cv_iter = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
                    scores = cross_val_score(pl, X, y, cv=cv_iter, scoring='accuracy', n_jobs=-1)
                else:
                    cv_iter = KFold(n_splits=3, shuffle=True, random_state=42)
                    scores = cross_val_score(pl, X, y, cv=cv_iter, scoring='r2', n_jobs=-1)
                return float(np.mean(scores))
            except:
                return -999.0
                
        if "XGBoost" not in model_name and "Random Forest" not in model_name and "LightGBM" not in model_name:
            break

        study = optuna.create_study(direction="maximize")
        study.optimize(objective, n_trials=5, timeout=15)
        
        if len(study.trials) > 0 and study.best_value > current_best_cv:
            # Improvement is REAL, keep it
            best_params = study.best_params
            current_best_params.update(best_params)
            
            best_model_inst = get_model_instance(model_name)
            best_model_inst.set_params(**current_best_params)
            
            best_pl = Pipeline(steps=[('preprocessor', preprocessor), ('model', best_model_inst)])
            train_sc, cv_sc, met = train_and_evaluate(best_pl, X, y, problem_type)
            
            status = diagnose_status(train_sc, cv_sc, problem_type)
            current_best_cv = cv_sc
            
            attempts.append({
                "attempt": attempt_num,
                "description": f"AI Action: {action} ({reason})",
                "train_score": train_sc,
                "cv_score": cv_sc,
                "status": status,
                "metrics": met,
                "pipeline": best_pl,
                "time": time.time() - start_time
            })
            
            if status in ["✓ Excellent", "✓ Good"]:
                break
        else:
            # NO real improvement, fallback to current_best_params and record failure
            attempts.append({
                "attempt": attempt_num,
                "description": f"AI Action: {action} (Did not improve)",
                "train_score": attempts[-1]["train_score"],
                "cv_score": current_best_cv,
                "status": attempts[-1]["status"],
                "metrics": attempts[-1]["metrics"],
                "pipeline": attempts[-1]["pipeline"],
                "time": time.time() - start_time
            })
            break

    return attempts

