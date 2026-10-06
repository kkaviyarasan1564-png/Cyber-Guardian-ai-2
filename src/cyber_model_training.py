"""
AI-Powered Cyber Defense System - Multi-Model Training & Evaluation
Trains, benchmarks, and exports Machine Learning threat detection models.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

from src.cyber_data_generator import generate_cyber_telemetry
from src.cyber_preprocessing import (
    build_cyber_preprocessor, prepare_data_for_modeling, save_preprocessor
)

def train_and_evaluate_models(
    data_path: str = "data/raw_cyber_security_telemetry.csv",
    models_dir: str = "models",
    random_state: int = 42
):
    """
    End-to-end training and benchmark pipeline for Cyber Defense Models.
    """
    os.makedirs(models_dir, exist_ok=True)
    
    # 1. Load or Generate Telemetry Data
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        print(f"[+] Loaded existing dataset from '{data_path}' ({len(df)} records).")
    else:
        print("[*] Generating new cybersecurity telemetry dataset...")
        df = generate_cyber_telemetry(n_samples=5000, random_state=random_state)
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        df.to_csv(data_path, index=False)
        print(f"[+] Dataset saved to '{data_path}'.")
        
    # 2. Prepare Features & Target
    X, y, label_encoder = prepare_data_for_modeling(df, target_col='threat_label')
    target_names = list(label_encoder.classes_)
    
    # 3. Train-Test Split (Stratified 80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )
    
    # 4. Fit Preprocessing Pipeline
    preprocessor = build_cyber_preprocessor()
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)
    
    # Save Preprocessor Bundle
    save_preprocessor(preprocessor, label_encoder, os.path.join(models_dir, "cyber_preprocessor.joblib"))
    
    # Extract Feature Names after transformation
    num_cols = preprocessor.named_steps['transformer'].transformers_[0][2]
    cat_encoder = preprocessor.named_steps['transformer'].transformers_[1][1].named_steps['encoder']
    cat_cols_encoded = list(cat_encoder.get_feature_names_out(['protocol']))
    all_feature_names = list(num_cols) + cat_cols_encoded
    joblib.dump(all_feature_names, os.path.join(models_dir, "cyber_feature_names.joblib"))
    
    # 5. Define ML Models for Benchmarking
    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=150, max_depth=16, random_state=random_state, n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=120, learning_rate=0.1, max_depth=5, random_state=random_state
        ),
        "Support Vector Classifier (SVM)": SVC(
            kernel='rbf', C=1.5, probability=True, random_state=random_state
        ),
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=random_state
        )
    }
    
    results = {}
    fitted_models = {}
    best_score = -1.0
    best_model_name = ""
    best_model_obj = None
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    
    print("\n" + "="*70)
    print(" [BENCHMARK] BENCHMARKING AI CYBER DEFENSE MACHINE LEARNING ALGORITHMS")
    print("="*70)
    
    for name, model in models.items():
        print(f"\n[*] Training and Cross-Validating: {name}...")
        
        # 5-Fold Cross Validation
        cv_scores = cross_val_score(model, X_train_trans, y_train, cv=cv, scoring='f1_weighted', n_jobs=-1)
        mean_cv = float(np.mean(cv_scores))
        std_cv = float(np.std(cv_scores))
        
        # Train on Full Training Set
        model.fit(X_train_trans, y_train)
        fitted_models[name] = model
        
        # Predict on Test Set
        y_pred = model.predict(X_test_trans)
        y_prob = model.predict_proba(X_test_trans)
        
        # Compute Metrics
        acc = float(accuracy_score(y_test, y_pred))
        prec_weighted = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
        rec_weighted = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
        f1_weighted = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
        f1_macro = float(f1_score(y_test, y_pred, average='macro', zero_division=0))
        
        try:
            auc = float(roc_auc_score(y_test, y_prob, multi_class='ovr', average='weighted'))
        except Exception:
            auc = 0.0
            
        cm = confusion_matrix(y_test, y_pred).tolist()
        report = classification_report(y_test, y_pred, target_names=target_names, output_dict=True, zero_division=0)
        
        results[name] = {
            "cv_f1_mean": round(mean_cv, 4),
            "cv_f1_std": round(std_cv, 4),
            "test_accuracy": round(acc, 4),
            "test_precision": round(prec_weighted, 4),
            "test_recall": round(rec_weighted, 4),
            "test_f1_weighted": round(f1_weighted, 4),
            "test_f1_macro": round(f1_macro, 4),
            "test_roc_auc": round(auc, 4),
            "confusion_matrix": cm,
            "classification_report": report
        }
        
        print(f"    --> Accuracy: {acc:.4f} | F1-Score: {f1_weighted:.4f} | ROC-AUC: {auc:.4f} | 5-Fold CV: {mean_cv:.4f} (+/-{std_cv:.4f})")
        
        if f1_weighted > best_score:
            best_score = f1_weighted
            best_model_name = name
            best_model_obj = model
            
    print("\n" + "="*70)
    print(f" [WINNER] TOP PERFORMING MODEL: {best_model_name} (Weighted F1: {best_score:.4f})")
    print("="*70)
    
    # Train Anomaly Detection Model (Zero-day threat discovery)
    print("\n[*] Fitting Anomaly Detector (Isolation Forest)...")
    anomaly_detector = IsolationForest(
        n_estimators=120, contamination=0.15, random_state=random_state, n_jobs=-1
    )
    # Fit only on benign traffic for pure anomaly profiling
    benign_idx = np.where(y_train == label_encoder.transform(['Benign'])[0])[0]
    anomaly_detector.fit(X_train_trans[benign_idx])
    joblib.dump(anomaly_detector, os.path.join(models_dir, "cyber_anomaly_detector.joblib"))
    
    # 6. Extract Feature Importance for Best Model (if supported)
    feature_importances = {}
    if hasattr(best_model_obj, 'feature_importances_'):
        importances = best_model_obj.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices:
            feature_importances[all_feature_names[idx]] = round(float(importances[idx]), 5)
    elif hasattr(best_model_obj, 'coef_'):
        coef_mean = np.mean(np.abs(best_model_obj.coef_), axis=0)
        sorted_indices = np.argsort(coef_mean)[::-1]
        for idx in sorted_indices:
            feature_importances[all_feature_names[idx]] = round(float(coef_mean[idx]), 5)
            
    # 7. Save Models and Metadata Artifacts
    joblib.dump(best_model_obj, os.path.join(models_dir, "best_cyber_model.joblib"))
    joblib.dump(fitted_models, os.path.join(models_dir, "all_cyber_models.joblib"))
    
    metadata = {
        "best_model": best_model_name,
        "classes": target_names,
        "metrics_summary": results,
        "feature_importances": feature_importances,
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_count": len(all_feature_names)
    }
    
    metadata_path = os.path.join(models_dir, "cyber_model_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"[+] Saved best model to '{os.path.join(models_dir, 'best_cyber_model.joblib')}'")
    print(f"[+] Saved metadata and metrics to '{metadata_path}'")
    return metadata

if __name__ == "__main__":
    train_and_evaluate_models()
