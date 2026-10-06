"""
AI-Powered Cyber Defense System - Preprocessing & Feature Engineering Pipeline
Handles security data cleaning, domain-specific feature engineering, 
categorical encoding, and standardization.
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib
import os

class CyberFeatureEngineer(BaseEstimator, TransformerMixin):
    """Custom transformer for cybersecurity domain feature engineering."""
    def __init__(self):
        pass
        
    def fit(self, X, y=None):
        return self
        
    def transform(self, X):
        X_df = X.copy()
        
        # 1. Network Traffic Flow Dynamics
        X_df['bytes_per_second'] = X_df['byte_count'] / (X_df['duration_sec'] + 0.001)
        X_df['packets_per_second'] = X_df['packet_count'] / (X_df['duration_sec'] + 0.001)
        X_df['avg_bytes_per_packet'] = X_df['byte_count'] / (X_df['packet_count'] + 1.0)
        
        # 2. Host Endpoint Threat Index
        X_df['endpoint_stress_index'] = (X_df['cpu_usage_pct'] * 0.5) + (X_df['ram_usage_pct'] * 0.5)
        
        # 3. Ransomware Specific Indicator (Entropy * Crypto API activity)
        X_df['crypto_entropy_burst'] = X_df['file_entropy_score'] * np.log1p(X_df['crypto_api_calls'])
        
        # 4. Identity & Recon Anomaly Score
        X_df['recon_threat_factor'] = (1.0 - X_df['ip_reputation_score']) * (X_df['failed_logins'] + 1.0)
        
        # 5. Phishing Payload Risk Index
        X_df['phishing_payload_risk'] = (X_df['url_length'] / 50.0) * (X_df['suspicious_keywords_count'] + 1.0)
        
        return X_df

def get_cyber_feature_names():
    """Returns the list of raw and engineered numerical and categorical features."""
    numerical_features = [
        'duration_sec', 'dest_port', 'packet_count', 'byte_count', 
        'src_bytes_ratio', 'failed_logins', 'cpu_usage_pct', 'ram_usage_pct',
        'file_io_rate_mb', 'file_entropy_score', 'dns_query_rate', 'url_length',
        'suspicious_keywords_count', 'connection_count_10m', 'syn_ack_ratio',
        'privilege_escalation_flag', 'crypto_api_calls', 'ip_reputation_score',
        'bytes_per_second', 'packets_per_second', 'avg_bytes_per_packet',
        'endpoint_stress_index', 'crypto_entropy_burst', 'recon_threat_factor',
        'phishing_payload_risk'
    ]
    categorical_features = ['protocol']
    return numerical_features, categorical_features

def build_cyber_preprocessor():
    """Builds a scikit-learn ColumnTransformer pipeline for cyber telemetry."""
    numerical_features, categorical_features = get_cyber_feature_names()
    
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, numerical_features),
            ('cat', cat_pipeline, categorical_features)
        ],
        remainder='drop'
    )
    
    full_pipeline = Pipeline([
        ('feature_engineer', CyberFeatureEngineer()),
        ('transformer', preprocessor)
    ])
    
    return full_pipeline

def prepare_data_for_modeling(df: pd.DataFrame, target_col: str = 'threat_label'):
    """
    Prepares features (X) and encoded labels (y).
    """
    X = df.drop(columns=['log_id', target_col], errors='ignore')
    
    if target_col in df.columns:
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(df[target_col])
        return X, y, label_encoder
    return X, None, None

def save_preprocessor(pipeline, label_encoder, filepath: str = "models/cyber_preprocessor.joblib"):
    """Serializes the preprocessing pipeline and label encoder."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    payload = {
        'pipeline': pipeline,
        'label_encoder': label_encoder
    }
    joblib.dump(payload, filepath)
    print(f"[+] Serialized cyber preprocessor and label encoder to '{filepath}'")

def load_preprocessor(filepath: str = "models/cyber_preprocessor.joblib"):
    """Loads the serialized preprocessor bundle."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Preprocessor artifact '{filepath}' not found.")
    payload = joblib.load(filepath)
    return payload['pipeline'], payload['label_encoder']

if __name__ == "__main__":
    from cyber_data_generator import generate_cyber_telemetry
    df = generate_cyber_telemetry(n_samples=500)
    X, y, le = prepare_data_for_modeling(df)
    pipe = build_cyber_preprocessor()
    X_trans = pipe.fit_transform(X)
    print(f"[+] Successfully processed sample data shape: {X_trans.shape}")
