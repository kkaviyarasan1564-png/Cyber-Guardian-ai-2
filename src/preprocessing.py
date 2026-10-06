"""
Data Preprocessing, Feature Engineering, and Feature Scaling Pipeline
for Online Learning Engagement Prediction.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline


NUMERICAL_FEATURES = [
    'login_frequency_per_week',
    'video_watch_time_hours',
    'video_completion_rate',
    'quiz_attempts',
    'quiz_avg_score',
    'assignment_submission_rate',
    'discussion_forum_posts',
    'days_inactive_last_30_days',
    'time_spent_per_session_mins',
    'previous_course_gpa',
    # Engineered features
    'active_days_ratio',
    'study_intensity_score',
    'forum_participation_rate'
]

CATEGORICAL_FEATURES = [
    'course_category',
    'device_type'
]

TARGET_COLUMN = 'engagement_level'
TARGET_CLASSES = ['Low', 'Medium', 'High']


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Construct high-value predictive domain features from raw educational telemetry.
    """
    df = df.copy()
    
    # 1. Active days ratio in the last month
    df['active_days_ratio'] = np.clip((30.0 - df['days_inactive_last_30_days']) / 30.0, 0.0, 1.0)
    
    # 2. Study intensity score (Weekly hours estimated: logins * session duration / 60)
    safe_session = df['time_spent_per_session_mins'].fillna(df['time_spent_per_session_mins'].median())
    df['study_intensity_score'] = (df['login_frequency_per_week'] * safe_session / 60.0).round(2)
    
    # 3. Forum participation per active week
    df['forum_participation_rate'] = (df['discussion_forum_posts'] / (df['login_frequency_per_week'] + 1)).round(2)
    
    return df


def build_preprocessor_pipeline():
    """
    Creates a scikit-learn ColumnTransformer for preprocessing numerical and categorical features.
    """
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
            ('num', num_pipeline, NUMERICAL_FEATURES),
            ('cat', cat_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder='drop'
    )
    
    return preprocessor


def prepare_data(data_path: str = "data/raw_online_learning_engagement.csv", test_size: float = 0.2, random_state: int = 42):
    """
    Loads raw data, performs feature engineering, encodes targets, and splits into train and test sets.
    """
    df = pd.read_csv(data_path)
    df_engineered = engineer_features(df)
    
    X = df_engineered[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y = df_engineered[TARGET_COLUMN]
    
    # Encode target labels: Low -> 0, Medium -> 1, High -> 2
    label_encoder = LabelEncoder()
    label_encoder.fit(TARGET_CLASSES)
    y_encoded = label_encoder.transform(y)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=test_size, random_state=random_state, stratify=y_encoded
    )
    
    preprocessor = build_preprocessor_pipeline()
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)
    
    # Extract feature names after OneHotEncoding
    ohe_cols = preprocessor.named_transformers_['cat'].named_steps['encoder'].get_feature_names_out(CATEGORICAL_FEATURES)
    all_feature_names = NUMERICAL_FEATURES + list(ohe_cols)
    
    return {
        'X_train_raw': X_train,
        'X_test_raw': X_test,
        'X_train_transformed': X_train_transformed,
        'X_test_transformed': X_test_transformed,
        'y_train': y_train,
        'y_test': y_test,
        'preprocessor': preprocessor,
        'label_encoder': label_encoder,
        'feature_names': all_feature_names,
        'df_full': df_engineered
    }


def save_preprocessing_artifacts(preprocessor, label_encoder, feature_names, save_dir: str = "models"):
    """
    Serializes preprocessing objects for production inference and Streamlit dashboard usage.
    """
    os.makedirs(save_dir, exist_ok=True)
    joblib.dump(preprocessor, os.path.join(save_dir, "preprocessor.joblib"))
    joblib.dump(label_encoder, os.path.join(save_dir, "label_encoder.joblib"))
    joblib.dump(feature_names, os.path.join(save_dir, "feature_names.joblib"))
    print(f"Preprocessing artifacts successfully saved to: {save_dir}")


if __name__ == "__main__":
    data_dict = prepare_data()
    save_preprocessing_artifacts(
        data_dict['preprocessor'],
        data_dict['label_encoder'],
        data_dict['feature_names']
    )
    print("Preprocessing completed.")
    print(f"X_train shape: {data_dict['X_train_transformed'].shape}")
    print(f"X_test shape: {data_dict['X_test_transformed'].shape}")
