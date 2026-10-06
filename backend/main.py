"""
FastAPI Backend Server for Online Learning Engagement Prediction & Early Warning System.
"""

import os
import sys
import json
import io
import pandas as pd
import numpy as np
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is on python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.preprocessing import engineer_features, NUMERICAL_FEATURES, CATEGORICAL_FEATURES
from src.alert_system import EngagementAlertEngine

app = FastAPI(
    title="EduPulse AI API",
    description="Backend API for Online Learning Engagement Prediction and Alert System",
    version="2.0.0"
)

# Enable CORS for local React/Vite development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Alert Engine and Metadata
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "raw_online_learning_engagement.csv"))

try:
    alert_engine = EngagementAlertEngine(models_dir=MODELS_DIR)
    with open(os.path.join(MODELS_DIR, "model_metadata.json"), "r") as f:
        model_metadata = json.load(f)
except Exception as e:
    print(f"Warning: Could not load model artifacts: {e}")
    alert_engine = None
    model_metadata = {}

# Load Cached Dataset for analytics
dataset_cache = None
if os.path.exists(DATA_PATH):
    try:
        dataset_cache = pd.read_csv(DATA_PATH)
    except Exception as e:
        print(f"Warning loading dataset: {e}")


# --- Pydantic Data Models ---
class StudentInput(BaseModel):
    student_id: Optional[str] = "STU_DEMO_01"
    course_category: str = Field(..., example="Computer Science")
    device_type: str = Field(..., example="Laptop")
    login_frequency_per_week: int = Field(..., ge=1, le=35, example=5)
    video_watch_time_hours: float = Field(..., ge=0.0, le=100.0, example=14.5)
    video_completion_rate: float = Field(..., ge=0.0, le=1.0, example=0.65)
    quiz_attempts: int = Field(..., ge=0, le=40, example=4)
    quiz_avg_score: float = Field(..., ge=0.0, le=100.0, example=72.0)
    assignment_submission_rate: float = Field(..., ge=0.0, le=1.0, example=0.80)
    discussion_forum_posts: int = Field(..., ge=0, le=60, example=3)
    days_inactive_last_30_days: int = Field(..., ge=0, le=30, example=4)
    time_spent_per_session_mins: float = Field(..., ge=1.0, le=240.0, example=35.0)
    previous_course_gpa: float = Field(..., ge=1.0, le=4.0, example=3.2)


class ActionTriggerRequest(BaseModel):
    student_id: str
    action_type: str
    instructor_note: Optional[str] = ""


class AdvisorChatRequest(BaseModel):
    message: str
    student_context: Optional[dict] = None


# --- API Routes ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EduPulse AI Backend",
        "model_loaded": alert_engine is not None,
        "active_model": model_metadata.get("best_model_name", "N/A")
    }


@app.get("/api/analytics/overview")
def get_analytics_overview():
    """
    Returns aggregate platform KPIs, engagement distributions, and correlation samples.
    """
    global dataset_cache
    if dataset_cache is None and os.path.exists(DATA_PATH):
        dataset_cache = pd.read_csv(DATA_PATH)
        
    if dataset_cache is None:
        raise HTTPException(status_code=404, detail="Analytics dataset not found.")
        
    df = dataset_cache
    total_students = len(df)
    counts = df['engagement_level'].value_counts().to_dict()
    
    # Class breakdown
    distribution = [
        {"name": "Low (At-Risk)", "value": int(counts.get('Low', 0)), "color": "#EF4444"},
        {"name": "Medium (Moderate)", "value": int(counts.get('Medium', 0)), "color": "#F59E0B"},
        {"name": "High (Highly Engaged)", "value": int(counts.get('High', 0)), "color": "#10B981"},
    ]
    
    # Course breakdown
    course_stats = []
    for cat, group in df.groupby('course_category'):
        c_counts = group['engagement_level'].value_counts().to_dict()
        course_stats.append({
            "category": cat,
            "total": len(group),
            "low": int(c_counts.get('Low', 0)),
            "medium": int(c_counts.get('Medium', 0)),
            "high": int(c_counts.get('High', 0)),
            "avg_quiz": round(float(group['quiz_avg_score'].mean()), 1),
            "avg_watch_time": round(float(group['video_watch_time_hours'].mean()), 1)
        })
        
    # Sample scatter data for frontend plotting (150 random records for smooth UI)
    sample_df = df.sample(min(150, len(df)), random_state=42)
    scatter_points = []
    for _, row in sample_df.iterrows():
        scatter_points.append({
            "student_id": row['student_id'],
            "video_hours": float(row['video_watch_time_hours']),
            "quiz_score": float(row['quiz_avg_score']) if pd.notnull(row['quiz_avg_score']) else 50.0,
            "logins": int(row['login_frequency_per_week']),
            "days_inactive": int(row['days_inactive_last_30_days']),
            "engagement": row['engagement_level'],
            "course": row['course_category']
        })
        
    return {
        "kpis": {
            "total_students": total_students,
            "at_risk_students": int(counts.get('Low', 0)),
            "at_risk_percentage": round(counts.get('Low', 0) / total_students * 100, 1),
            "moderate_students": int(counts.get('Medium', 0)),
            "engaged_students": int(counts.get('High', 0)),
            "avg_quiz_score": round(float(df['quiz_avg_score'].mean()), 1),
            "avg_video_hours": round(float(df['video_watch_time_hours'].mean()), 1),
            "avg_submission_rate": round(float(df['assignment_submission_rate'].mean() * 100), 1),
            "avg_inactive_days": round(float(df['days_inactive_last_30_days'].mean()), 1)
        },
        "engagement_distribution": distribution,
        "course_breakdown": course_stats,
        "scatter_sample": scatter_points
    }


@app.post("/api/predict/single")
def predict_single_student(payload: StudentInput):
    """
    Evaluates engagement probability for a single student and produces intervention alerts.
    """
    if alert_engine is None:
        raise HTTPException(status_code=500, detail="Alert Engine is not loaded.")
        
    student_dict = payload.model_dump()
    result = alert_engine.predict_single_student(student_dict)
    result['student_id'] = payload.student_id
    result['inputs'] = student_dict
    return result


@app.post("/api/predict/batch")
async def predict_batch_csv(file: UploadFile = File(...)):
    """
    Processes an uploaded CSV file, executes batch ML scoring, and returns annotated student records.
    """
    if alert_engine is None:
        raise HTTPException(status_code=500, detail="Alert Engine is not loaded.")
        
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        required_cols = ['login_frequency_per_week', 'video_watch_time_hours', 'video_completion_rate',
                         'quiz_attempts', 'quiz_avg_score', 'assignment_submission_rate',
                         'discussion_forum_posts', 'days_inactive_last_30_days', 'time_spent_per_session_mins',
                         'course_category', 'device_type']
                         
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing required CSV columns: {missing}")
            
        scored_df = alert_engine.batch_predict(df)
        
        # Replace NaNs with None for JSON serialization
        records = scored_df.replace({np.nan: None}).to_dict(orient="records")
        
        total = len(records)
        critical_count = sum(1 for r in records if r.get('alert_level') == 'CRITICAL')
        warning_count = sum(1 for r in records if r.get('alert_level') == 'WARNING')
        stable_count = sum(1 for r in records if r.get('alert_level') == 'STABLE')
        
        return {
            "summary": {
                "total_processed": total,
                "critical_count": critical_count,
                "warning_count": warning_count,
                "stable_count": stable_count
            },
            "records": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process batch CSV: {str(e)}")


@app.get("/api/alerts/roster")
def get_alert_roster(
    severity: Optional[str] = Query(None, description="Comma-separated: CRITICAL,WARNING,STABLE"),
    course: Optional[str] = None,
    min_risk: float = 0.0,
    search: Optional[str] = None
):
    """
    Returns the scored roster of all students with live filter capabilities.
    """
    global dataset_cache
    if dataset_cache is None and os.path.exists(DATA_PATH):
        dataset_cache = pd.read_csv(DATA_PATH)
        
    if dataset_cache is None or alert_engine is None:
        raise HTTPException(status_code=404, detail="Dataset or model unavailable.")
        
    scored = alert_engine.batch_predict(dataset_cache)
    
    if severity:
        sev_list = [s.strip().upper() for s in severity.split(",")]
        scored = scored[scored['alert_level'].isin(sev_list)]
        
    if course and course != "All":
        scored = scored[scored['course_category'] == course]
        
    if min_risk > 0.0:
        scored = scored[scored['disengagement_risk_score'] >= min_risk]
        
    if search:
        scored = scored[scored['student_id'].str.contains(search, case=False, na=False)]
        
    scored = scored.sort_values(by="disengagement_risk_score", ascending=False)
    records = scored.replace({np.nan: None}).to_dict(orient="records")
    
    return {
        "total": len(records),
        "students": records
    }


@app.post("/api/alerts/trigger-action")
def trigger_action(req: ActionTriggerRequest):
    """
    Simulates sending an automated intervention trigger (Email/SMS/Tutoring meeting invite).
    """
    return {
        "success": True,
        "student_id": req.student_id,
        "action_type": req.action_type,
        "message": f"Pedagogical action '{req.action_type}' dispatched successfully to Student {req.student_id}.",
        "timestamp": pd.Timestamp.now().isoformat()
    }


@app.get("/api/models/info")
def get_model_diagnostics():
    """
    Returns ML model leaderboards, confusion matrices, and feature importances.
    """
    return model_metadata


@app.post("/api/chat/advisor")
def pedagogical_advisor_chat(req: AdvisorChatRequest):
    """
    Intelligent AI Pedagogical Assistant providing tailored interventions and tutoring strategies.
    """
    msg = req.message.lower()
    ctx = req.student_context or {}
    
    risk = ctx.get("disengagement_risk_score", 0.5)
    pred = ctx.get("predicted_engagement_level", "Medium")
    inactivity = ctx.get("days_inactive_last_30_days", 10)
    quiz = ctx.get("quiz_avg_score", 60)
    
    if "why" in msg or "reason" in msg or "risk" in msg:
        reasons = []
        if inactivity >= 10:
            reasons.append(f"prolonged dormancy ({inactivity} days without logging in)")
        if quiz < 60:
            reasons.append(f"formative quiz difficulty (average score of {quiz}%)")
        if ctx.get("assignment_submission_rate", 1.0) < 0.6:
            reasons.append("incomplete assignment submissions")
            
        reason_str = ", ".join(reasons) if reasons else "moderate decline in active learning signals"
        reply = (
            f"Based on telemetry diagnostics, this student's risk profile ({pred} engagement) is primarily driven by: "
            f"**{reason_str}**. Immediate targeted intervention can reverse this trajectory."
        )
    elif "action" in msg or "recommend" in msg or "help" in msg or "what should i do" in msg:
        reply = (
            "Here is the recommended 3-step intervention roadmap:\n"
            "1. **Direct Communication**: Dispatch an empathetic mentor check-in via SMS/Email addressing specific assignment barriers.\n"
            "2. **Content Adaptation**: Provide chapter-segmented review videos with 1.25x speed guidance and prerequisite practice quizzes.\n"
            "3. **Deadline Flexibility**: Offer a 48-hour grace window to submit missing modules without penalty."
        )
    elif "email" in msg or "template" in msg or "draft" in msg:
        student_id = ctx.get("student_id", "Learner")
        course = ctx.get("course_category", "your course")
        reply = (
            f"📧 **Personalized Student Outreach Draft**:\n\n"
            f"Subject: Checking in on your progress in {course} 💡\n\n"
            f"Hi {student_id},\n\n"
            f"We noticed you haven't been able to log in over the past few days, and we want to make sure you have everything you need to succeed in {course}.\n\n"
            f"If you're finding any quiz topics tricky or need an extension on upcoming assignments, our academic coaching team is here to support you. You can schedule a 1-on-1 tutoring session anytime.\n\n"
            f"Best regards,\nYour Learning Support Team"
        )
    else:
        reply = (
            f"I am EduPulse AI Advisor. For student {ctx.get('student_id', 'under review')}, engagement is estimated at "
            f"**{pred}** (Risk: {risk*100:.1f}%). Ask me for intervention strategies, customized email drafts, or metric root-cause breakdowns."
        )
        
    return {"reply": reply}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
