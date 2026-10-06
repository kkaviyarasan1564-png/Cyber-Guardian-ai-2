import React, { useState, useEffect } from 'react';
import { Cpu, Trophy, BarChart3, HelpCircle, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from 'axios';

export default function ModelDiagnosticsTab() {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/models/info');
        setMetadata(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  if (loading || !metadata) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading ML benchmark metrics & interpretability data...
      </div>
    );
  }

  const modelComp = metadata.model_comparison || {};
  const comparisonList = Object.entries(modelComp).map(([name, data]) => ({
    name,
    ...data,
    f1_pct: (data.f1_macro * 100).toFixed(1),
    acc_pct: (data.accuracy * 100).toFixed(1),
  }));

  const bestName = metadata.best_model_name;
  const bestModelData = modelComp[bestName] || {};
  const cm = bestModelData.confusion_matrix || [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

  const featImpList = Object.entries(metadata.feature_importance || {})
    .slice(0, 10)
    .map(([feature, importance]) => ({
      feature: feature.replace(/_/g, ' '),
      importance: Number((importance * 100).toFixed(1))
    }))
    .reverse();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>Machine Learning Benchmark Leaderboard & Explainability (XAI)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Comparing 5 multi-class classification algorithms evaluated on cross-validated test telemetry splits.
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Algorithm Performance Comparison</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full">
            Selected in Production: {bestName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Model Architecture</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Macro Precision</th>
                <th className="px-4 py-3">Macro Recall</th>
                <th className="px-4 py-3">Macro F1-Score</th>
                <th className="px-4 py-3">ROC-AUC (OvR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparisonList.map((m, idx) => {
                const isBest = m.name === bestName;
                return (
                  <tr key={idx} className={isBest ? 'bg-blue-600/10 font-semibold' : 'hover:bg-slate-900/40'}>
                    <td className="px-4 py-3 text-white flex items-center space-x-2">
                      {isBest && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{m.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{(m.accuracy * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono">{(m.precision_macro * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono">{(m.recall_macro * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-400">{(m.f1_macro * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono text-purple-400">
                      {typeof m.roc_auc_ovr === 'number' ? m.roc_auc_ovr.toFixed(4) : m.roc_auc_ovr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Feature Importances */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Top 10 Influential Telemetry Predictors</h3>
              <p className="text-xs text-slate-400">Relative global feature attribution ranking</p>
            </div>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featImpList} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="importance" fill="#38BDF8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Confusion Matrix ({bestName})</h3>
              <p className="text-xs text-slate-400">True Class vs. Predicted Class counts on test set</p>
            </div>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div></div>
              <div className="font-bold text-slate-400">Pred: Low</div>
              <div className="font-bold text-slate-400">Pred: Med</div>
              <div className="font-bold text-slate-400">Pred: High</div>

              <div className="font-bold text-slate-400 self-center text-right pr-2">Actual: Low</div>
              <div className="p-3 bg-blue-600/30 border border-blue-500/40 rounded-lg font-bold text-white">{cm[0]?.[0] || 0}</div>
              <div className="p-3 bg-slate-800 rounded-lg text-slate-400">{cm[0]?.[1] || 0}</div>
              <div className="p-3 bg-slate-800 rounded-lg text-slate-400">{cm[0]?.[2] || 0}</div>

              <div className="font-bold text-slate-400 self-center text-right pr-2">Actual: Med</div>
              <div className="p-3 bg-slate-800 rounded-lg text-slate-400">{cm[1]?.[0] || 0}</div>
              <div className="p-3 bg-blue-600/30 border border-blue-500/40 rounded-lg font-bold text-white">{cm[1]?.[1] || 0}</div>
              <div className="p-3 bg-slate-800 rounded-lg text-slate-400">{cm[1]?.[2] || 0}</div>

              <div className="font-bold text-slate-400 self-center text-right pr-2">Actual: High</div>
              <div className="p-3 bg-slate-800 rounded-lg text-slate-400">{cm[2]?.[0] || 0}</div>
              <div className="p-3 bg-slate-800 rounded-lg text-slate-400">{cm[2]?.[1] || 0}</div>
              <div className="p-3 bg-blue-600/30 border border-blue-500/40 rounded-lg font-bold text-white">{cm[2]?.[2] || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
