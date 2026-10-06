import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Sliders, 
  CheckCheck,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const PRESETS = {
  atRisk: {
    student_id: 'STU_AT_RISK_DEMO',
    course_category: 'Computer Science',
    device_type: 'Laptop',
    login_frequency_per_week: 2,
    video_watch_time_hours: 3.5,
    video_completion_rate: 0.22,
    quiz_attempts: 1,
    quiz_avg_score: 38.0,
    assignment_submission_rate: 0.25,
    discussion_forum_posts: 0,
    days_inactive_last_30_days: 18,
    time_spent_per_session_mins: 15.0,
    previous_course_gpa: 2.1
  },
  moderate: {
    student_id: 'STU_MODERATE_DEMO',
    course_category: 'Data Science',
    device_type: 'Desktop',
    login_frequency_per_week: 5,
    video_watch_time_hours: 16.0,
    video_completion_rate: 0.62,
    quiz_attempts: 4,
    quiz_avg_score: 68.5,
    assignment_submission_rate: 0.70,
    discussion_forum_posts: 3,
    days_inactive_last_30_days: 6,
    time_spent_per_session_mins: 40.0,
    previous_course_gpa: 3.0
  },
  high: {
    student_id: 'STU_HIGH_PERFORMER_DEMO',
    course_category: 'Engineering',
    device_type: 'Laptop',
    login_frequency_per_week: 9,
    video_watch_time_hours: 38.0,
    video_completion_rate: 0.94,
    quiz_attempts: 8,
    quiz_avg_score: 92.0,
    assignment_submission_rate: 0.98,
    discussion_forum_posts: 12,
    days_inactive_last_30_days: 1,
    time_spent_per_session_mins: 75.0,
    previous_course_gpa: 3.85
  }
};

export default function PredictorTab({ onOpenAdvisorWithContext }) {
  const [formData, setFormData] = useState(PRESETS.atRisk);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [actionDone, setActionDone] = useState({});

  const handlePreset = (presetKey) => {
    setFormData(PRESETS[presetKey]);
    setResult(null);
    setActionDone({});
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setActionDone({});
    try {
      const response = await axios.post('http://localhost:8000/api/predict/single', formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      alert('Error connecting to ML backend. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAction = async (actionText) => {
    try {
      await axios.post('http://localhost:8000/api/alerts/trigger-action', {
        student_id: formData.student_id,
        action_type: actionText
      });
      setActionDone((prev) => ({ ...prev, [actionText]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Presets Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <span>Real-Time Learner Telemetry Predictor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test any learner profile to predict engagement level, dropout risk, and generate intervention plans.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Quick Scenarios:</span>
          <button
            onClick={() => handlePreset('atRisk')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
          >
            🚨 At-Risk Demo
          </button>
          <button
            onClick={() => handlePreset('moderate')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            ⚠️ Moderate Demo
          </button>
          <button
            onClick={() => handlePreset('high')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
          >
            ✅ Top Engaged
          </button>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Live Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (7 cols) */}
        <form onSubmit={handlePredict} className="lg:col-span-7 glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Telemetry Parameters & Learner Attributes
            </h3>
            <span className="text-xs font-mono text-blue-400">ID: {formData.student_id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course Category */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Course Domain</label>
              <select
                value={formData.course_category}
                onChange={(e) => handleChange('course_category', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Data Science">Data Science</option>
                <option value="Business & Management">Business & Management</option>
                <option value="Engineering">Engineering</option>
                <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
              </select>
            </div>

            {/* Device Type */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Primary Access Device</label>
              <select
                value={formData.device_type}
                onChange={(e) => handleChange('device_type', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Mobile">Mobile</option>
                <option value="Tablet">Tablet</option>
              </select>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="space-y-4">
            {/* Logins & Inactivity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Logins per Week</span>
                  <span className="font-bold text-blue-400">{formData.login_frequency_per_week} logins</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="28"
                  value={formData.login_frequency_per_week}
                  onChange={(e) => handleChange('login_frequency_per_week', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Days Inactive (Last 30d)</span>
                  <span className={`font-bold ${formData.days_inactive_last_30_days > 10 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {formData.days_inactive_last_30_days} days
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={formData.days_inactive_last_30_days}
                  onChange={(e) => handleChange('days_inactive_last_30_days', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>

            {/* Video Hours & Video Completion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Video Watch Time</span>
                  <span className="font-bold text-indigo-400">{formData.video_watch_time_hours} hrs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="0.5"
                  value={formData.video_watch_time_hours}
                  onChange={(e) => handleChange('video_watch_time_hours', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Video Completion Rate</span>
                  <span className="font-bold text-indigo-400">{Math.round(formData.video_completion_rate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.video_completion_rate}
                  onChange={(e) => handleChange('video_completion_rate', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Quiz Score & Attempts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Average Quiz Score</span>
                  <span className="font-bold text-emerald-400">{formData.quiz_avg_score}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.quiz_avg_score}
                  onChange={(e) => handleChange('quiz_avg_score', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Assignment Submission Rate</span>
                  <span className="font-bold text-emerald-400">{Math.round(formData.assignment_submission_rate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.assignment_submission_rate}
                  onChange={(e) => handleChange('assignment_submission_rate', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Forum Posts & Session Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Forum Posts & Discussions</span>
                  <span className="font-bold text-purple-400">{formData.discussion_forum_posts} posts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={formData.discussion_forum_posts}
                  onChange={(e) => handleChange('discussion_forum_posts', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Avg. Session Duration</span>
                  <span className="font-bold text-purple-400">{formData.time_spent_per_session_mins} mins</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={formData.time_spent_per_session_mins}
                  onChange={(e) => handleChange('time_spent_per_session_mins', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Machine Learning Diagnostic...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Execute Real-Time Engagement Classification</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Prediction Outcome & Interventions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6 animate-fadeIn">
              {/* Outcome Badge Card */}
              <div
                className="p-5 rounded-xl border text-center space-y-2"
                style={{
                  backgroundColor: `${result.alert_color}15`,
                  borderColor: `${result.alert_color}40`
                }}
              >
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  Predicted Engagement Status
                </span>
                <div
                  className="text-3xl font-extrabold"
                  style={{ color: result.alert_color }}
                >
                  {result.predicted_engagement_level}
                </div>
                <p className="text-xs font-medium text-slate-300">{result.alert_badge}</p>
              </div>

              {/* Disengagement Risk Progress Bar */}
              <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Disengagement / Dropout Risk</span>
                  <span className="font-bold text-base" style={{ color: result.alert_color }}>
                    {(result.disengagement_risk_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, result.disengagement_risk_score * 100)}%`,
                      backgroundColor: result.alert_color
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>0% (Safe)</span>
                  <span>35% (Warning)</span>
                  <span>60% (Critical)</span>
                </div>
              </div>

              {/* Class Probability Distribution */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ML Confidence Probabilities
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <div className="text-[10px] text-rose-400 font-semibold">Low</div>
                    <div className="text-sm font-bold text-white">
                      {(result.probabilities.Low * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[10px] text-amber-400 font-semibold">Medium</div>
                    <div className="text-sm font-bold text-white">
                      {(result.probabilities.Medium * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-400 font-semibold">High</div>
                    <div className="text-sm font-bold text-white">
                      {(result.probabilities.High * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Pedagogical Interventions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Recommended Pedagogical Interventions
                  </h4>
                  <button
                    onClick={() => onOpenAdvisorWithContext(result)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                  >
                    <span>Ask AI Coach</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {result.recommended_interventions.map((action, idx) => {
                    const isDispatched = actionDone[action];
                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 gap-2"
                      >
                        <p className="flex-1 leading-relaxed">{action}</p>
                        <button
                          onClick={() => handleTriggerAction(action)}
                          disabled={isDispatched}
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all flex items-center space-x-1 ${
                            isDispatched
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                          }`}
                        >
                          {isDispatched ? (
                            <>
                              <CheckCheck className="w-3 h-3" />
                              <span>Dispatched</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>Dispatch</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center min-h-[350px] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Zap className="w-7 h-7" />
              </div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-base font-bold text-white">Ready for Diagnostic</h4>
                <p className="text-xs text-slate-400">
                  Select a preset scenario or adjust the telemetry parameters on the left and click Execute to generate instant risk predictions.
                </p>
              </div>
              <button
                onClick={handlePredict}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
              >
                Run Quick Demo Prediction
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
