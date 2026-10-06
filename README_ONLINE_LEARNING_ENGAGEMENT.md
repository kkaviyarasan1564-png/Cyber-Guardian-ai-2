# 🎓 EduPulse AI - Full-Stack Online Learning Engagement Platform & Website

An enterprise-grade, full-stack predictive intelligence platform and modern SaaS website designed for digital learning platforms (LMS, MOOCs, Coursera, edX, Canvas). The system monitors multi-modal student interaction telemetry, forecasts engagement levels (Low / Medium / High), detects at-risk learners, and triggers personalized pedagogical intervention recommendations.

---

## 🌟 Full-Stack Web Application Features

1. **Modern React 18 + Tailwind CSS + Vite Frontend (`frontend/`)**:
   - 📊 **Executive Overview Dashboard**: High-level KPIs, animated donut distributions, course breakdowns, and interactive scatter matrices.
   - 🎯 **Real-Time Telemetry Predictor**: Interactive sliders, 3 instant scenario presets (At-Risk, Moderate, Top Engaged), risk gauges, and confidence distributions.
   - 🚨 **Early-Warning & Intervention Alert Center**: Filter vulnerable learners by severity & risk score, dispatch simulated mentor check-ins and tutoring sessions, and export custom rosters to CSV.
   - 📂 **Batch Telemetry Scoring Studio**: Drag-and-drop CSV batch upload with instant validation, live table pagination, and enriched CSV export.
   - 📈 **ML Explainability (XAI) & Diagnostics**: 5-model benchmark leaderboard, confusion matrix visualizer, and top feature importance rankings.
   - 🤖 **AI Pedagogical Advisor Chatbot Modal**: Context-aware assistant to explain risk factors and draft personalized outreach emails.

2. **FastAPI High-Performance REST API Backend (`backend/main.py`)**:
   - `/api/analytics/overview` - Aggregate telemetry KPIs & cohort distributions
   - `/api/predict/single` - Real-time ML inference & intervention engine
   - `/api/predict/batch` - Multipart CSV batch scoring pipeline
   - `/api/alerts/roster` - Filterable student risk roster
   - `/api/alerts/trigger-action` - Action dispatch simulator (Email / Tutoring)
   - `/api/models/info` - Model metrics & feature attribution
   - `/api/chat/advisor` - AI Education Advisor Copilot

---

## 🚀 How to Run the Web Platform

### Option 1: One-Click Launch (Recommended)
Double-click or run:
```cmd
run_fullstack.bat
```
This automatically starts both the FastAPI backend and the React web application.

---

### Option 2: Run Separately via Terminal

#### 1. Start the FastAPI Backend:
```cmd
cd "C:\Users\kkavi\OneDrive\Desktop\data science project"
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Documentation available at:* `http://127.0.0.1:8000/docs`

#### 2. Start the React Modern Frontend:
```cmd
cd "C:\Users\kkavi\OneDrive\Desktop\data science project\frontend"
npm run dev
```
*Web Application available at:* `http://localhost:5173`

---

### Option 3: Streamlit Interactive Dashboard
```cmd
cd "C:\Users\kkavi\OneDrive\Desktop\data science project"
.venv\Scripts\streamlit run app.py
```
*Streamlit Dashboard available at:* `http://localhost:8501`
