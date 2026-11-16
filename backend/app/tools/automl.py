import os
import uuid
import time
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

from sklearn.model_selection import StratifiedKFold, KFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

# Classification Metrics
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
# Regression Metrics
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
# Unsupervised Metrics
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score

# Models
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    ExtraTreesClassifier, ExtraTreesRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
    HistGradientBoostingClassifier, HistGradientBoostingRegressor
)
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB

# Clustering
from sklearn.cluster import KMeans, MiniBatchKMeans, DBSCAN, AgglomerativeClustering, SpectralClustering
from sklearn.mixture import GaussianMixture

# Dimensionality Reduction
from sklearn.decomposition import PCA, TruncatedSVD

# Anomaly Detection
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.neighbors import LocalOutlierFactor

# Try importing external libraries gracefully
try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier, LGBMRegressor
    HAS_LGBM = True
except ImportError:
    HAS_LGBM = False

def get_compatible_models(learning_type: str, problem_type: str = None) -> List[str]:
    """Returns a list of compatible model names based on learning and problem types."""
    models = []
    if learning_type == "supervised":
        if problem_type == "classification":
            models = []
            if HAS_XGB:
                models.append("XGBoost")
            models.extend([
                "Random Forest", "Gradient Boosting", "HistGradientBoosting", 
                "Logistic Regression", "Decision Tree", "Extra Trees", 
                "SVM", "KNN", "Naive Bayes"
            ])
            if HAS_LGBM:
                models.append("LightGBM")
        else: # regression
            models = []
            if HAS_XGB:
                models.append("XGBoost Regressor")
            models.extend([
                "Random Forest Regressor", "Gradient Boosting Regressor", 
                "HistGradientBoosting Regressor", "Linear Regression", "Ridge", "Lasso", 
                "Elastic Net", "Decision Tree Regressor", "Extra Trees Regressor", 
                "SVR", "KNN Regressor"
            ])
            if HAS_LGBM:
                models.append("LightGBM Regressor")
    elif learning_type == "unsupervised":
        models = [
            "K-Means", "Mini-Batch K-Means", "DBSCAN", "Agglomerative Clustering", "Gaussian Mixture",
            "PCA", "Truncated SVD", "Isolation Forest", "One-Class SVM"
        ]
    return models

def get_model_instance(model_name: str, random_state: int = 42):
    """Instantiates a model based on its name."""
    mapping = {
        # Classification
        "Logistic Regression": LogisticRegression(random_state=random_state, max_iter=1000),
        "Decision Tree": DecisionTreeClassifier(random_state=random_state),
        "Random Forest": RandomForestClassifier(random_state=random_state),
        "Extra Trees": ExtraTreesClassifier(random_state=random_state),
        "Gradient Boosting": GradientBoostingClassifier(random_state=random_state),
        "HistGradientBoosting": HistGradientBoostingClassifier(random_state=random_state),
        "SVM": SVC(random_state=random_state, probability=True),
        "KNN": KNeighborsClassifier(),
        "Naive Bayes": GaussianNB(),
        
        # Regression
        "Linear Regression": LinearRegression(),
        "Ridge": Ridge(random_state=random_state),
        "Lasso": Lasso(random_state=random_state),
        "Elastic Net": ElasticNet(random_state=random_state),
        "Decision Tree Regressor": DecisionTreeRegressor(random_state=random_state),
        "Random Forest Regressor": RandomForestRegressor(random_state=random_state),
        "Extra Trees Regressor": ExtraTreesRegressor(random_state=random_state),
        "Gradient Boosting Regressor": GradientBoostingRegressor(random_state=random_state),
        "HistGradientBoosting Regressor": HistGradientBoostingRegressor(random_state=random_state),
        "SVR": SVR(),
        "KNN Regressor": KNeighborsRegressor(),
        
        # Unsupervised Clustering
        "K-Means": KMeans(random_state=random_state, n_init='auto'),
        "Mini-Batch K-Means": MiniBatchKMeans(random_state=random_state, n_init='auto'),
        "DBSCAN": DBSCAN(),
        "Agglomerative Clustering": AgglomerativeClustering(),
        "Gaussian Mixture": GaussianMixture(random_state=random_state),
        
        # Dim Reduction
        "PCA": PCA(random_state=random_state),
        "Truncated SVD": TruncatedSVD(random_state=random_state),
        
        # Anomaly Detection
        "Isolation Forest": IsolationForest(random_state=random_state),
        "One-Class SVM": OneClassSVM()
    }
    
    if HAS_XGB:
        mapping["XGBoost"] = XGBClassifier(random_state=random_state, eval_metric='logloss')
        mapping["XGBoost Classifier"] = XGBClassifier(random_state=random_state, eval_metric='logloss')
        mapping["XGBClassifier"] = XGBClassifier(random_state=random_state, eval_metric='logloss')
        mapping["XGBoost Regressor"] = XGBRegressor(random_state=random_state)
        mapping["XGBoostRegressor"] = XGBRegressor(random_state=random_state)
        mapping["XGBRegressor"] = XGBRegressor(random_state=random_state)
    if HAS_LGBM:
        mapping["LightGBM"] = LGBMClassifier(random_state=random_state)
        mapping["LightGBM Classifier"] = LGBMClassifier(random_state=random_state)
        mapping["LGBMClassifier"] = LGBMClassifier(random_state=random_state)
        mapping["LightGBM Regressor"] = LGBMRegressor(random_state=random_state)
        mapping["LightGBMRegressor"] = LGBMRegressor(random_state=random_state)
        mapping["LGBMRegressor"] = LGBMRegressor(random_state=random_state)
        
    return mapping.get(model_name)

def build_preprocessor(df: pd.DataFrame, features: List[str]) -> ColumnTransformer:
    numeric_features = df[features].select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = df[features].select_dtypes(exclude=['int64', 'float64']).columns.tolist()

    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    return preprocessor

def evaluate_classification(y_true, y_pred, y_prob) -> Dict[str, Any]:
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
    }
    
    try:
        if y_prob is not None:
            if len(np.unique(y_true)) == 2:
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob[:, 1]))
            else:
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob, multi_class='ovr'))
    except:
        pass
        
    metrics["confusion_matrix"] = confusion_matrix(y_true, y_pred).tolist()
    return metrics

def evaluate_regression(y_true, y_pred) -> Dict[str, Any]:
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "mse": float(mean_squared_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2": float(r2_score(y_true, y_pred))
    }

def extract_feature_importance(pipeline: Pipeline, raw_features: List[str]) -> List[Dict[str, Any]]:
    """Extracts normalized feature importance or model coefficients for XAI."""
    try:
        model = pipeline.named_steps.get('model')
        preprocessor = pipeline.named_steps.get('preprocessor')
        if model is None:
            return []
            
        importances = None
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            coef = model.coef_
            if coef.ndim > 1:
                importances = np.mean(np.abs(coef), axis=0)
            else:
                importances = np.abs(coef)
                
        if importances is None:
            return []
            
        # Try to map to transformed feature names, or fall back to raw_features
        try:
            feature_names = preprocessor.get_feature_names_out()
            # Clean feature names (e.g. remainder__age -> age, onehot__color_red -> color: red)
            cleaned_names = []
            for fn in feature_names:
                parts = fn.split('__', 1)
                cleaned_names.append(parts[1] if len(parts) > 1 else fn)
        except:
            cleaned_names = [f"Feature {i+1}" for i in range(len(importances))]
            
        if len(cleaned_names) != len(importances):
            cleaned_names = raw_features if len(raw_features) == len(importances) else [f"Feature {i+1}" for i in range(len(importances))]
            
        # Group and aggregate importances back by original feature if one-hot encoded
        agg_importances: Dict[str, float] = {}
        for fn, imp in zip(cleaned_names, importances):
            # Find base feature name
            base_feat = fn
            for rf in raw_features:
                if fn == rf or fn.startswith(f"{rf}_"):
                    base_feat = rf
                    break
            agg_importances[base_feat] = agg_importances.get(base_feat, 0.0) + float(imp)
            
        total = sum(agg_importances.values())
        if total > 0:
            for k in agg_importances:
                agg_importances[k] = round(agg_importances[k] / total, 4)
                
        # Sort descending
        sorted_feats = sorted(
            [{"feature": k, "importance": v, "percentage": round(v * 100, 1)} for k, v in agg_importances.items()],
            key=lambda x: x["importance"],
            reverse=True
        )
        return sorted_feats[:10]
    except Exception as e:
        print(f"Feature importance extraction warning: {e}")
        return []

def train_supervised(model_name: str, df: pd.DataFrame, features: List[str], target: str, problem_type: str) -> Dict[str, Any]:
    from app.tools.diagnosis import improve_model
    
    # Run the automated diagnosis and improvement loop
    attempts = improve_model(model_name, df, features, target, problem_type)
    
    if not attempts:
        raise ValueError(f"Failed to generate any training attempts for {model_name}")
        
    # The last attempt is our final selected model for this algorithm
    final_attempt = attempts[-1]
    
    # Save the best pipeline for this model
    model_id = str(uuid.uuid4())
    os.makedirs("models", exist_ok=True)
    model_path = os.path.join("models", f"{model_id}.pkl")
    joblib.dump(final_attempt["pipeline"], model_path)
    
    # Extract feature importances (XAI)
    feature_importances = extract_feature_importance(final_attempt["pipeline"], features)
    
    # Serialize attempts (remove non-JSON serializable objects like the pipeline)
    serialized_attempts = []
    for att in attempts:
        att_copy = {k: v for k, v in att.items() if k != "pipeline"}
        serialized_attempts.append(att_copy)
    
    return {
        "model_id": model_id,
        "name": model_name,
        "main_score": final_attempt["train_score"],
        "cv_score": final_attempt["cv_score"],
        "metrics": final_attempt["metrics"],
        "train_time_sec": round(final_attempt["time"], 2),
        "status": final_attempt["status"],
        "path": model_path,
        "attempts": serialized_attempts,
        "generalization_gap": round(final_attempt["train_score"] - final_attempt["cv_score"], 4),
        "feature_importances": feature_importances
    }


def train_unsupervised(model_name: str, df: pd.DataFrame, features: List[str]) -> Dict[str, Any]:
    start_time = time.time()
    
    X = df[features]
    preprocessor = build_preprocessor(df, features)
    model = get_model_instance(model_name)
    
    if model is None:
        raise ValueError(f"Model {model_name} not found or unsupported.")
        
    pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('model', model)])
    
    # Train
    pipeline.fit(X)
    
    metrics = {}
    main_score = 0.0
    status = "Trained"
    
    try:
        # If it's a clustering algorithm, we can calculate silhouette score
        if hasattr(pipeline.named_steps['model'], 'labels_'):
            labels = pipeline.named_steps['model'].labels_
            X_trans = preprocessor.transform(X)
            
            # Subsample for very large datasets to compute silhouette faster
            if X_trans.shape[0] > 10000:
                indices = np.random.choice(X_trans.shape[0], 10000, replace=False)
                X_trans = X_trans[indices]
                labels = labels[indices]
                
            if len(np.unique(labels)) > 1:
                metrics["silhouette_score"] = float(silhouette_score(X_trans, labels))
                metrics["calinski_harabasz"] = float(calinski_harabasz_score(X_trans, labels))
                metrics["davies_bouldin"] = float(davies_bouldin_score(X_trans, labels))
                main_score = metrics["silhouette_score"]
                status = "Good" if main_score > 0.4 else "Fair"
    except Exception as e:
        print(f"Metrics calculation failed: {e}")
        
    train_time = time.time() - start_time
    
    # Save Model
    model_id = str(uuid.uuid4())
    os.makedirs("models", exist_ok=True)
    model_path = os.path.join("models", f"{model_id}.pkl")
    joblib.dump(pipeline, model_path)
    
    return {
        "model_id": model_id,
        "name": model_name,
        "main_score": main_score,
        "cv_score": 0.0, # N/A for unsupervised
        "metrics": metrics,
        "train_time_sec": round(train_time, 2),
        "status": status,
        "path": model_path
    }
