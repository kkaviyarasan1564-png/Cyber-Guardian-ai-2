import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import axios from 'axios';

export default function BatchPredictTab() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('http://localhost:8000/api/predict/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBatchResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to process batch CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleHeaders = "student_id,course_category,device_type,login_frequency_per_week,video_watch_time_hours,video_completion_rate,quiz_attempts,quiz_avg_score,assignment_submission_rate,discussion_forum_posts,days_inactive_last_30_days,time_spent_per_session_mins,previous_course_gpa\n";
    const sampleRows = [
      "STU_BATCH_01,Computer Science,Laptop,2,4.0,0.25,1,45.0,0.30,0,16,18.0,2.3\n",
      "STU_BATCH_02,Data Science,Desktop,6,18.5,0.70,4,74.0,0.85,3,4,45.0,3.2\n",
      "STU_BATCH_03,Engineering,Laptop,10,42.0,0.95,9,94.0,1.0,14,0,80.0,3.9\n"
    ].join("");
    
    const csvBlob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_learner_telemetry_batch_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportScored = () => {
    if (!batchResult?.records?.length) return;
    const records = batchResult.records;
    const headers = Object.keys(records[0]).join(',');
    const rows = records.map((r) => Object.values(r).map((v) => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scored_batch_predictions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Description */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-blue-400" />
              <span>Batch Learner Telemetry Scoring Studio</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload institutional CSV logs to batch score thousands of students simultaneously with ML models and alert tags.
            </p>
          </div>

          <button
            onClick={handleDownloadSample}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold self-start"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="glass-card p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 transition-all text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="max-w-md mx-auto space-y-1">
          <h4 className="text-sm font-bold text-white">Choose CSV File or Drag & Drop</h4>
          <p className="text-xs text-slate-400">
            Accepts `.csv` files containing learner telemetry interaction attributes.
          </p>
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload-input"
        />

        <div className="flex items-center justify-center space-x-3 pt-2">
          <label
            htmlFor="csv-upload-input"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-all"
          >
            Browse Files
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scoring Batch...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Process & Predict Dataset</span>
              </>
            )}
          </button>
        </div>

        {file && (
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-blue-400">
            <FileText className="w-3.5 h-3.5" />
            <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center space-x-2 text-xs text-rose-400 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Batch Results View */}
      {batchResult && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Total Scored</span>
              <div className="text-2xl font-bold text-white mt-1">
                {batchResult.summary.total_processed}
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <span className="text-xs text-rose-400 font-semibold">Critical Alerts (High Risk)</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {batchResult.summary.critical_count}
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <span className="text-xs text-amber-400 font-semibold">Warning Alerts</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {batchResult.summary.warning_count}
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="text-xs text-emerald-400 font-semibold">Stable / High Engaged</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {batchResult.summary.stable_count}
              </div>
            </div>
          </div>

          {/* Results Table & Export */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Batch Inference Preview ({batchResult.records.length} Students)
              </span>
              <button
                onClick={handleExportScored}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Enriched CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="sticky top-0 bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Predicted Class</th>
                    <th className="px-4 py-3">Alert Severity</th>
                    <th className="px-4 py-3">Disengagement Risk</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Recommended Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {batchResult.records.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="px-4 py-2.5 font-mono font-bold text-white">{row.student_id}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-200">{row.predicted_engagement}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.alert_level === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : row.alert_level === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {row.alert_level}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold">
                        {((row.disengagement_risk_score || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">{row.course_category}</td>
                      <td className="px-4 py-2.5 text-slate-300 truncate max-w-xs">{row.primary_recommended_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
