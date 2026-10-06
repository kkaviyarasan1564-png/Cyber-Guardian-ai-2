"""
Early Warning and Intelligent Alert System for Online Learning Engagement.

Identifies at-risk students, calculates disengagement probability scores,
categorizes risk levels, and triggers targeted pedagogical interventions.
"""

import os
import joblib
import numpy as np
import pandas as pd

try:
    from src.preprocessing import engineer_features, NUMERICAL_FEATURES, CATEGORICAL_FEATURES
except ImportError:
    from preprocessing import engineer_features, NUMERICAL_FEATURES, CATEGORICAL_FEATURES


class EngagementAlertEngine:
    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        self.model = None
        self.preprocessor = None
        self.label_encoder = None
        self._load_artifacts()
        
    def _load_artifacts(self):
        model_path = os.path.join(self.models_dir, "best_engagement_model.joblib")
        preprocessor_path = os.path.join(self.models_dir, "preprocessor.joblib")
        encoder_path = os.path.join(self.models_dir, "label_encoder.joblib")
        
        if not os.path.exists(model_path) or not os.path.exists(preprocessor_path):
            raise FileNotFoundError(
                f"Model or Preprocessor artifact missing in '{self.models_dir}'. "
                "Please run model_training.py first."
            )
            
        self.model = joblib.load(model_path)
        self.preprocessor = joblib.load(preprocessor_path)
        self.label_encoder = joblib.load(encoder_path)
        
    def generate_pedagogical_interventions(self, row: dict, predicted_level: str, risk_score: float) -> list:
        """
        Synthesizes rule-based actionable intervention recommendations tailored to specific student telemetry.
        """
        interventions = []
        
        # Check specific bottleneck metrics
        days_inactive = row.get('days_inactive_last_30_days', 0)
        video_comp = row.get('video_completion_rate', 1.0)
        quiz_score = row.get('quiz_avg_score', 100)
        assignment_rate = row.get('assignment_submission_rate', 1.0)
        forum_posts = row.get('discussion_forum_posts', 0)
        login_freq = row.get('login_frequency_per_week', 5)
        
        if predicted_level == 'Low' or risk_score >= 0.60:
            interventions.append("🚨 Priority 1: Automated SMS / Email check-in from academic success coach.")
            if days_inactive >= 10:
                interventions.append(f"⏱️ Inactivity Alert ({days_inactive} days idle): Trigger 'Welcome Back' re-engagement email sequence.")
            if assignment_rate < 0.50:
                interventions.append("📝 Assignment Gap: Offer grace period extension and link to assignment walkthrough guide.")
            if quiz_score < 55.0:
                interventions.append("📚 Knowledge Remediation: Recommend diagnostic review modules and peer tutoring session.")
            if login_freq <= 2:
                interventions.append("📅 Study Habit Intervention: Suggest setting up a recurring calendar study reminder.")
        elif predicted_level == 'Medium' or (0.35 <= risk_score < 0.60):
            interventions.append("⚠️ Nudge Notification: Send weekly progress summary with targeted milestone goals.")
            if video_comp < 0.60:
                interventions.append("🎥 Video Engagement: Suggest 1.25x speed option or chapter-based video viewing.")
            if forum_posts <= 1:
                interventions.append("💬 Community Building: Invite to participate in weekly discussion prompt for bonus engagement points.")
            if quiz_score < 70.0:
                interventions.append("💡 Practice Boost: Unlock optional practice quizzes with instant solution feedback.")
        else:
            interventions.append("🌟 Recognition: Award 'Consistent Scholar' digital badge and invite to peer mentoring program.")
            interventions.append("🚀 Challenge Extension: Recommend advanced optional project track and masterclass materials.")
            
        return interventions

    def predict_single_student(self, student_data: dict) -> dict:
        """
        Predict engagement for a single student dictionary and produce alert diagnostics.
        """
        df_single = pd.DataFrame([student_data])
        df_eng = engineer_features(df_single)
        
        X_trans = self.preprocessor.transform(df_eng[NUMERICAL_FEATURES + CATEGORICAL_FEATURES])
        pred_encoded = self.model.predict(X_trans)[0]
        pred_label = self.label_encoder.inverse_transform([pred_encoded])[0]
        
        probabilities = {}
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(X_trans)[0]
            classes = self.label_encoder.classes_
            for cls_name, prob in zip(classes, probs):
                probabilities[cls_name] = round(float(prob), 4)
        else:
            probabilities = {pred_label: 1.0}
            
        # Disengagement Risk Score = Probability of 'Low' class
        # (or weighted combination: P(Low) + 0.35 * P(Medium))
        p_low = probabilities.get('Low', 0.0)
        p_med = probabilities.get('Medium', 0.0)
        risk_score = round(p_low + 0.30 * p_med, 4)
        
        # Alert Severity Tag
        if risk_score >= 0.60 or pred_label == 'Low':
            alert_level = 'CRITICAL'
            alert_color = '#EF4444' # Red
            alert_badge = '🚨 High Risk / Immediate Intervention Required'
        elif risk_score >= 0.35 or pred_label == 'Medium':
            alert_level = 'WARNING'
            alert_color = '#F59E0B' # Amber
            alert_badge = '⚠️ Moderate Risk / Proactive Nudge Recommended'
        else:
            alert_level = 'STABLE'
            alert_color = '#10B981' # Green
            alert_badge = '✅ High Engagement / Healthy Learner State'
            
        interventions = self.generate_pedagogical_interventions(student_data, pred_label, risk_score)
        
        return {
            'predicted_engagement_level': pred_label,
            'probabilities': probabilities,
            'disengagement_risk_score': risk_score,
            'alert_level': alert_level,
            'alert_color': alert_color,
            'alert_badge': alert_badge,
            'recommended_interventions': interventions
        }
        
    def batch_predict(self, df_input: pd.DataFrame) -> pd.DataFrame:
        """
        Process a batch dataframe of students, adding engagement predictions, risk scores, and alert statuses.
        """
        df_copy = df_input.copy()
        df_eng = engineer_features(df_copy)
        
        X_trans = self.preprocessor.transform(df_eng[NUMERICAL_FEATURES + CATEGORICAL_FEATURES])
        preds_encoded = self.model.predict(X_trans)
        preds_labels = self.label_encoder.inverse_transform(preds_encoded)
        
        df_copy['predicted_engagement'] = preds_labels
        
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(X_trans)
            classes = list(self.label_encoder.classes_)
            low_idx = classes.index('Low') if 'Low' in classes else 0
            med_idx = classes.index('Medium') if 'Medium' in classes else 1
            high_idx = classes.index('High') if 'High' in classes else 2
            
            df_copy['prob_low'] = probs[:, low_idx].round(4)
            df_copy['prob_medium'] = probs[:, med_idx].round(4)
            df_copy['prob_high'] = probs[:, high_idx].round(4)
            df_copy['disengagement_risk_score'] = (df_copy['prob_low'] + 0.30 * df_copy['prob_medium']).round(4)
        else:
            df_copy['disengagement_risk_score'] = df_copy['predicted_engagement'].map(
                {'Low': 0.85, 'Medium': 0.45, 'High': 0.10}
            )
            
        def assign_alert_level(row):
            risk = row['disengagement_risk_score']
            level = row['predicted_engagement']
            if risk >= 0.60 or level == 'Low':
                return 'CRITICAL'
            elif risk >= 0.35 or level == 'Medium':
                return 'WARNING'
            else:
                return 'STABLE'
                
        df_copy['alert_level'] = df_copy.apply(assign_alert_level, axis=1)
        
        def assign_action(row):
            if row['alert_level'] == 'CRITICAL':
                return "1-on-1 Academic Coach Outreach & Deadline Extension"
            elif row['alert_level'] == 'WARNING':
                return "Automated Study Habit Nudge & Video Catchup Guide"
            else:
                return "Honor Roll Recognition & Advanced Challenges"
                
        df_copy['primary_recommended_action'] = df_copy.apply(assign_action, axis=1)
        
        return df_copy


if __name__ == "__main__":
    engine = EngagementAlertEngine()
    sample_student = {
        'course_category': 'Computer Science',
        'device_type': 'Laptop',
        'login_frequency_per_week': 2,
        'video_watch_time_hours': 4.5,
        'video_completion_rate': 0.25,
        'quiz_attempts': 1,
        'quiz_avg_score': 42.0,
        'assignment_submission_rate': 0.30,
        'discussion_forum_posts': 0,
        'days_inactive_last_30_days': 16,
        'time_spent_per_session_mins': 18.0,
        'previous_course_gpa': 2.4
    }
    result = engine.predict_single_student(sample_student)
    print("\n--- Single Student Test Result ---")
    print(f"Predicted Level: {result['predicted_engagement_level']}")
    print(f"Disengagement Risk: {result['disengagement_risk_score'] * 100:.1f}%")
    print(f"Alert Level: {result['alert_level']}")
    print("Interventions:")
    for action in result['recommended_interventions']:
        # Encode safely for Windows console output
        safe_action = action.encode('ascii', errors='replace').decode('ascii')
        print(" -", safe_action)
