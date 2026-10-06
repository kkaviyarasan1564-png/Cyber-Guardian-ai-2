"""
Data Source & Simulation Module for Online Learning Engagement Prediction.

Generates realistic multimodal learner interaction telemetry data representing
online educational platforms (e.g., Coursera, Canvas, edX, Blackboard).
"""

import os
import numpy as np
import pandas as pd


def generate_engagement_data(n_samples: int = 2500, random_seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic online learning telemetry dataset.
    
    Features:
    - student_id: Unique Student Identifier
    - course_category: Field of study (Computer Science, Data Science, Business, Humanities, Engineering)
    - login_frequency_per_week: Number of logins in a typical week (1 to 28)
    - video_watch_time_hours: Total video watch hours in the past month (0.5 to 60.0)
    - video_completion_rate: Ratio of video watched to total duration (0.05 to 1.0)
    - quiz_attempts: Number of formative quiz attempts (0 to 20)
    - quiz_avg_score: Mean percentage score on quizzes (0.0 to 100.0)
    - assignment_submission_rate: Ratio of on-time assignments submitted (0.0 to 1.0)
    - discussion_forum_posts: Number of posts/replies made in community forums (0 to 35)
    - days_inactive_last_30_days: Number of days without any platform event (0 to 28)
    - time_spent_per_session_mins: Average duration per login session (5 to 120 mins)
    - device_type: Primary access device (Desktop, Laptop, Mobile, Tablet)
    - previous_course_gpa: Prior academic performance (1.5 to 4.0 scale)
    
    Target:
    - engagement_level: 'Low' (At-Risk / Disengaged), 'Medium' (Moderate Engagement), 'High' (Highly Engaged)
    """
    np.random.seed(random_seed)
    
    student_ids = [f"STU_{10000 + i}" for i in range(n_samples)]
    
    course_categories = np.random.choice(
        ['Computer Science', 'Data Science', 'Business & Management', 'Engineering', 'Humanities & Social Sciences'],
        size=n_samples,
        p=[0.30, 0.25, 0.20, 0.15, 0.10]
    )
    
    device_types = np.random.choice(
        ['Laptop', 'Desktop', 'Mobile', 'Tablet'],
        size=n_samples,
        p=[0.45, 0.30, 0.18, 0.07]
    )
    
    # Latent student motivation variable (unobserved driving factor)
    latent_motivation = np.random.beta(a=2.5, b=2.5, size=n_samples) # values in [0, 1]
    
    # Generate features conditioned on latent motivation with realistic noise
    login_frequency_per_week = np.clip(
        np.round(latent_motivation * 18 + np.random.normal(2, 2.5, size=n_samples)),
        1, 28
    ).astype(int)
    
    video_watch_time_hours = np.clip(
        latent_motivation * 45.0 + np.random.normal(5.0, 4.0, size=n_samples),
        0.5, 65.0
    ).round(1)
    
    video_completion_rate = np.clip(
        latent_motivation * 0.75 + np.random.uniform(0.15, 0.35, size=n_samples) + np.random.normal(0, 0.08, size=n_samples),
        0.05, 1.0
    ).round(3)
    
    quiz_attempts = np.clip(
        np.round(latent_motivation * 14 + np.random.poisson(lam=3, size=n_samples)),
        0, 25
    ).astype(int)
    
    quiz_avg_score = np.clip(
        latent_motivation * 50.0 + 40.0 + np.random.normal(0, 9.0, size=n_samples),
        20.0, 100.0
    ).round(1)
    
    assignment_submission_rate = np.clip(
        latent_motivation * 0.70 + 0.25 + np.random.normal(0, 0.10, size=n_samples),
        0.0, 1.0
    ).round(3)
    
    discussion_forum_posts = np.clip(
        np.round(latent_motivation * 20 + np.random.exponential(scale=2.0, size=n_samples)),
        0, 40
    ).astype(int)
    
    days_inactive_last_30_days = np.clip(
        np.round((1.0 - latent_motivation) * 22 + np.random.normal(2.0, 3.0, size=n_samples)),
        0, 29
    ).astype(int)
    
    time_spent_per_session_mins = np.clip(
        latent_motivation * 60.0 + 15.0 + np.random.normal(0, 12.0, size=n_samples),
        5.0, 130.0
    ).round(1)
    
    previous_course_gpa = np.clip(
        latent_motivation * 1.8 + 2.0 + np.random.normal(0, 0.3, size=n_samples),
        1.5, 4.0
    ).round(2)
    
    # Calculate composite engagement index (ground truth logic with noise)
    composite_index = (
        0.20 * (login_frequency_per_week / 20.0) +
        0.20 * (video_completion_rate) +
        0.18 * (assignment_submission_rate) +
        0.17 * (quiz_avg_score / 100.0) +
        0.12 * (np.minimum(discussion_forum_posts, 15) / 15.0) +
        0.13 * (1.0 - (days_inactive_last_30_days / 30.0))
    )
    
    # Map to Engagement Level
    # Low: < 0.45, Medium: 0.45 - 0.70, High: >= 0.70
    engagement_levels = []
    for score in composite_index:
        if score < 0.46:
            engagement_levels.append('Low')
        elif score < 0.71:
            engagement_levels.append('Medium')
        else:
            engagement_levels.append('High')
            
    df = pd.DataFrame({
        'student_id': student_ids,
        'course_category': course_categories,
        'device_type': device_types,
        'login_frequency_per_week': login_frequency_per_week,
        'video_watch_time_hours': video_watch_time_hours,
        'video_completion_rate': video_completion_rate,
        'quiz_attempts': quiz_attempts,
        'quiz_avg_score': quiz_avg_score,
        'assignment_submission_rate': assignment_submission_rate,
        'discussion_forum_posts': discussion_forum_posts,
        'days_inactive_last_30_days': days_inactive_last_30_days,
        'time_spent_per_session_mins': time_spent_per_session_mins,
        'previous_course_gpa': previous_course_gpa,
        'engagement_level': engagement_levels
    })
    
    # Introduce small missing values to replicate real-world data issues (2-3% missing)
    mask_quiz = np.random.rand(n_samples) < 0.025
    df.loc[mask_quiz, 'quiz_avg_score'] = np.nan
    
    mask_session = np.random.rand(n_samples) < 0.02
    df.loc[mask_session, 'time_spent_per_session_mins'] = np.nan
    
    mask_gpa = np.random.rand(n_samples) < 0.03
    df.loc[mask_gpa, 'previous_course_gpa'] = np.nan
    
    return df


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    df = generate_engagement_data(n_samples=3000, random_seed=42)
    output_path = os.path.join("data", "raw_online_learning_engagement.csv")
    df.to_csv(output_path, index=False)
    print(f"Dataset generated successfully with {len(df)} records at: {output_path}")
    print("Class distribution:")
    print(df['engagement_level'].value_counts(normalize=True))
