"""
Machine Learning Training, Model Comparison, and Evaluation Module
for Online Learning Engagement Prediction.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

try:
    from src.preprocessing import prepare_data, save_preprocessing_artifacts, TARGET_CLASSES
except ImportError:
    from preprocessing import prepare_data, save_preprocessing_artifacts, TARGET_CLASSES


def train_and_evaluate_models(data_dict: dict, save_dir: str = "models"):
    """
    Trains a benchmark suite of ML models, calculates evaluation metrics, and saves the top performer.
    """
    os.makedirs(save_dir, exist_ok=True)
    
    X_train = data_dict['X_train_transformed']
    X_test = data_dict['X_test_transformed']
    y_train = data_dict['y_train']
    y_test = data_dict['y_test']
    feature_names = data_dict['feature_names']
    label_encoder = data_dict['label_encoder']
    
    models = {
        'Random Forest': RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42),
        'Logistic Regression': LogisticRegression(max_iter=1000, C=1.0, random_state=42),
        'Support Vector Machine': SVC(kernel='rbf', C=1.0, probability=True, random_state=42),
        'K-Nearest Neighbors': KNeighborsClassifier(n_neighbors=7, weights='distance')
    }
    
    results = {}
    trained_models = {}
    
    print("\n--- Training and Evaluating Machine Learning Models ---")
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None
        
        acc = accuracy_score(y_test, y_pred)
        prec_macro = precision_score(y_test, y_pred, average='macro', zero_division=0)
        rec_macro = recall_score(y_test, y_pred, average='macro', zero_division=0)
        f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        auc_ovr = None
        if y_prob is not None:
            try:
                auc_ovr = roc_auc_score(y_test, y_prob, multi_class='ovr', average='macro')
            except Exception:
                auc_ovr = None
                
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        results[name] = {
            'accuracy': round(float(acc), 4),
            'precision_macro': round(float(prec_macro), 4),
            'recall_macro': round(float(rec_macro), 4),
            'f1_macro': round(float(f1_macro), 4),
            'f1_weighted': round(float(f1_weighted), 4),
            'roc_auc_ovr': round(float(auc_ovr), 4) if auc_ovr is not None else "N/A",
            'confusion_matrix': cm
        }
        trained_models[name] = model
        
        print(f"[{name}] -> Accuracy: {acc:.4f} | F1-Score (Macro): {f1_macro:.4f} | ROC-AUC: {auc_ovr if auc_ovr else 'N/A'}")
        
    # Select best model based on F1-Macro
    best_model_name = max(results, key=lambda k: results[k]['f1_macro'])
    best_model = trained_models[best_model_name]
    print(f"\nBest Model Selected: {best_model_name} (F1-Macro: {results[best_model_name]['f1_macro']})")
    
    # Calculate feature importances for tree-based or linear models
    feature_importance_dict = {}
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        feature_importance_dict = {
            name: round(float(imp), 4)
            for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        }
    elif hasattr(best_model, 'coef_'):
        coef_abs_mean = np.mean(np.abs(best_model.coef_), axis=0)
        feature_importance_dict = {
            name: round(float(imp), 4)
            for name, imp in sorted(zip(feature_names, coef_abs_mean), key=lambda x: x[1], reverse=True)
        }
    else:
        # Fallback to Random Forest feature importance
        rf_model = trained_models['Random Forest']
        importances = rf_model.feature_importances_
        feature_importance_dict = {
            name: round(float(imp), 4)
            for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        }
        
    # Save artifacts
    joblib.dump(best_model, os.path.join(save_dir, "best_engagement_model.joblib"))
    joblib.dump(trained_models, os.path.join(save_dir, "all_trained_models.joblib"))
    
    metadata = {
        'best_model_name': best_model_name,
        'model_comparison': results,
        'feature_importance': feature_importance_dict,
        'target_classes': TARGET_CLASSES,
        'feature_names': feature_names
    }
    
    with open(os.path.join(save_dir, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)
        
    print(f"Best model & comparison metrics saved to {save_dir}/")
    return metadata, best_model


if __name__ == "__main__":
    # 1. Prepare data
    data_dict = prepare_data()
    
    # 2. Save preprocessors
    save_preprocessing_artifacts(
        data_dict['preprocessor'],
        data_dict['label_encoder'],
        data_dict['feature_names']
    )
    
    # 3. Train models & save
    metadata, best_model = train_and_evaluate_models(data_dict)
