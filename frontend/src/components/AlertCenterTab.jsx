import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Filter, 
  Download, 
  Send, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Calendar,
  CheckCheck
} from 'lucide-react';
import axios from 'axios';

export default function AlertCenterTab({ onOpenAdvisorWithContext }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('CRITICAL,WARNING');
  const [courseFilter, setCourseFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dispatchedActions, setDispatchedActions] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      if (courseFilter && courseFilter !== 'All') params.course = courseFilter;
      if (search) params.search = search;

      const res = await axios.get('http://localhost:8000/api/alerts/roster', { params });
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [severityFilter, courseFilter, search]);

  const handleAction = async (studentId, actionName) => {
    try {
      await axios.post('http://localhost:8000/api/alerts/trigger-action', {
        student_id: studentId,
        action_type: actionName
      });
      setDispatchedActions((prev) => ({
        ...prev,
        [`${studentId}_${actionName}`]: true
      }));
      setToastMessage(`Action '${actionName}' dispatched to ${studentId}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (!students.length) return;
    const headers = Object.keys(students[0]).join(',');
    const rows = students.map((s) => Object.values(s).map((v) => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `at_risk_students_roster_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 text-xs font-semibold animate-bounce">
          <CheckCheck className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Early Warning & Intervention Alert Center</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Screening platform learners for dropout vulnerabilities and dispatching immediate pedagogical support.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export Filtered Roster (CSV)</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search by Student ID */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Student ID (e.g. STU_10012)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="CRITICAL,WARNING">🚨 Critical & Warning (At-Risk)</option>
              <option value="CRITICAL">🔴 Critical Alerts Only</option>
              <option value="WARNING">🟡 Warning Alerts Only</option>
              <option value="STABLE">🟢 Stable / Engaged Only</option>
              <option value="">All Students</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Course Domains</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Science">Data Science</option>
              <option value="Business & Management">Business & Management</option>
              <option value="Engineering">Engineering</option>
              <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Identified Vulnerable Students ({students.length} Records)
          </span>
          <span className="text-[11px] text-slate-400">Sorted by highest disengagement risk</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading alert telemetry data...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students matching the current filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Alert Severity</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Dormancy</th>
                  <th className="px-4 py-3">Quiz / Video</th>
                  <th className="px-4 py-3">Primary Action</th>
                  <th className="px-4 py-3 text-right">Quick Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student, idx) => {
                  const isCritical = student.alert_level === 'CRITICAL';
                  const isWarning = student.alert_level === 'WARNING';
                  const emailSent = dispatchedActions[`${student.student_id}_email`];
                  const tutorBooked = dispatchedActions[`${student.student_id}_tutoring`];

                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {student.student_id}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {student.course_category}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {student.alert_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold font-mono">
                        <span
                          className={
                            isCritical
                              ? 'text-rose-400'
                              : isWarning
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {(student.disengagement_risk_score * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className={student.days_inactive_last_30_days >= 10 ? 'text-rose-400 font-semibold' : ''}>
                          {student.days_inactive_last_30_days} days idle
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div>Quiz: <span className="font-semibold text-white">{student.quiz_avg_score}%</span></div>
                        <div className="text-[10px] text-slate-400">Watch: {student.video_watch_time_hours}h ({Math.round(student.video_completion_rate * 100)}%)</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={student.primary_recommended_action}>
                        {student.primary_recommended_action}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleAction(student.student_id, 'email')}
                            disabled={emailSent}
                            title="Send Automated Academic Check-In Email"
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              emailSent
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleAction(student.student_id, 'tutoring')}
                            disabled={tutorBooked}
                            title="Schedule 1-on-1 Mentor Counseling Session"
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              tutorBooked
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
