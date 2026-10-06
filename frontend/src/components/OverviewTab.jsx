import React from 'react';
import { 
  Users, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Award, 
  TrendingUp,
  BookOpen,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ScatterChart, 
  Scatter, 
  ZAxis 
} from 'recharts';

export default function OverviewTab({ analytics, onSelectStudent, setActiveTab }) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Aggregating real-time learner telemetry analytics...</p>
        </div>
      </div>
    );
  }

  const { kpis, engagement_distribution, course_breakdown, scatter_sample } = analytics;

  const kpiCards = [
    {
      title: 'Total Enrolled Students',
      value: kpis.total_students.toLocaleString(),
      subtext: 'Across 5 Course Domains',
      icon: Users,
      border: 'border-slate-800',
      iconColor: 'text-blue-400',
      bgGlow: 'from-blue-500/10'
    },
    {
      title: 'At-Risk Learners (Low)',
      value: `${kpis.at_risk_students} (${kpis.at_risk_percentage}%)`,
      subtext: 'High disengagement probability',
      icon: AlertOctagon,
      border: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      bgGlow: 'from-rose-500/10',
      badge: 'Action Required'
    },
    {
      title: 'Moderate Engagement',
      value: kpis.moderate_students.toLocaleString(),
      subtext: 'Stable but monitor progress',
      icon: Clock,
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      bgGlow: 'from-amber-500/10'
    },
    {
      title: 'Highly Engaged Students',
      value: kpis.engaged_students.toLocaleString(),
      subtext: 'High retention & quiz mastery',
      icon: CheckCircle2,
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10'
    },
    {
      title: 'Avg. Quiz Performance',
      value: `${kpis.avg_quiz_score}%`,
      subtext: `Avg. Watch: ${kpis.avg_video_hours} hrs/mo`,
      icon: Award,
      border: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
      bgGlow: 'from-indigo-500/10'
    }
  ];

  const COLORS = {
    'Low (At-Risk)': '#EF4444',
    'Medium (Moderate)': '#F59E0B',
    'High (Highly Engaged)': '#10B981',
    'Low': '#EF4444',
    'Medium': '#F59E0B',
    'High': '#10B981'
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-6 md:p-8 border border-blue-500/20 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Telemetry Insights & Early-Warning Pipeline</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Online Learner Engagement & Retention Intelligence Platform
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Continuously analyzing video watch hours, assignment consistency, quiz mastery, and platform dormancy to preempt student dropout and deliver personalized pedagogical interventions.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('alerts')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs tracking-wide transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Review {kpis.at_risk_students} At-Risk Students</span>
            </button>
            <button
              onClick={() => setActiveTab('predictor')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-blue-500/20"
            >
              <span>Test Real-Time Predictor</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl glass-card p-5 border ${card.border} bg-gradient-to-b ${card.bgGlow} to-transparent transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg bg-slate-800/80 ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{card.subtext}</span>
                {card.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {card.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Level Pie Distribution */}
        <div className="rounded-xl glass-card p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Learner Engagement Distribution</h3>
              <p className="text-xs text-slate-400">Breakdown of student cohort by engagement class</p>
            </div>
            <span className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded-md font-mono">
              N = {kpis.total_students}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagement_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {engagement_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Category Breakdown Bar */}
        <div className="rounded-xl glass-card p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Engagement by Academic Domain</h3>
              <p className="text-xs text-slate-400">Distribution of Low, Medium, and High engagement by subject</p>
            </div>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={course_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="low" name="At-Risk (Low)" fill="#EF4444" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" name="Moderate (Med)" fill="#F59E0B" stackId="a" />
                <Bar dataKey="high" name="Engaged (High)" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Behavioral Correlation Scatter Matrix */}
      <div className="rounded-xl glass-card p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Telemetry Correlation: Video Watch Time vs. Quiz Score</h3>
            <p className="text-xs text-slate-400">
              Visualizing how lecture consumption and quiz mastery correlate with student risk level
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-300">At-Risk (Low)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">Moderate</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Engaged</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                dataKey="video_hours" 
                name="Video Hours" 
                unit="h"
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Video Watch Time (Hours/Month)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="quiz_score" 
                name="Quiz Score" 
                unit="%" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Quiz Avg Score (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
              />
              <ZAxis type="number" dataKey="logins" range={[40, 200]} name="Logins" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                        <div className="font-bold text-white">{data.student_id} ({data.course})</div>
                        <div className="text-slate-300">Engagement: <span className="font-semibold" style={{ color: COLORS[data.engagement] }}>{data.engagement}</span></div>
                        <div className="text-slate-300">Watch Hours: <span className="font-semibold text-white">{data.video_hours}h</span></div>
                        <div className="text-slate-300">Quiz Score: <span className="font-semibold text-white">{data.quiz_score}%</span></div>
                        <div className="text-slate-300">Days Inactive: <span className="font-semibold text-rose-400">{data.days_inactive} days</span></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                data={scatter_sample.filter(p => p.engagement === 'Low')} 
                fill="#EF4444" 
                opacity={0.8}
              />
              <Scatter 
                data={scatter_sample.filter(p => p.engagement === 'Medium')} 
                fill="#F59E0B" 
                opacity={0.8}
              />
              <Scatter 
                data={scatter_sample.filter(p => p.engagement === 'High')} 
                fill="#10B981" 
                opacity={0.8}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
