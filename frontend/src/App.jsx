import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import OverviewTab from './components/OverviewTab';
import PredictorTab from './components/PredictorTab';
import AlertCenterTab from './components/AlertCenterTab';
import BatchPredictTab from './components/BatchPredictTab';
import ModelDiagnosticsTab from './components/ModelDiagnosticsTab';
import AdvisorChatModal from './components/AdvisorChatModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorContext, setAdvisorContext] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/analytics/overview');
        setAnalytics(res.data);
      } catch (err) {
        console.error("Error fetching overview analytics:", err);
      }
    };
    fetchAnalytics();
  }, []);

  const handleOpenAdvisor = (context = null) => {
    setAdvisorContext(context);
    setIsAdvisorOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAdvisor={() => handleOpenAdvisor(null)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab 
            analytics={analytics} 
            setActiveTab={setActiveTab} 
            onSelectStudent={(stu) => {
              setActiveTab('predictor');
            }} 
          />
        )}

        {activeTab === 'predictor' && (
          <PredictorTab 
            onOpenAdvisorWithContext={(ctx) => handleOpenAdvisor(ctx)} 
          />
        )}

        {activeTab === 'alerts' && (
          <AlertCenterTab 
            onOpenAdvisorWithContext={(ctx) => handleOpenAdvisor(ctx)} 
          />
        )}

        {activeTab === 'batch' && (
          <BatchPredictTab />
        )}

        {activeTab === 'models' && (
          <ModelDiagnosticsTab />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 EduPulse AI • Online Learning Engagement Prediction & Early Warning System</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>FastAPI 2.0 Backend</span>
            <span>•</span>
            <span>React 18 + Tailwind</span>
            <span>•</span>
            <span>Scikit-Learn Pipeline</span>
          </div>
        </div>
      </footer>

      {/* AI Pedagogical Advisor Modal */}
      <AdvisorChatModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        studentContext={advisorContext}
      />
    </div>
  );
}
