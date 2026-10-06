import React from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  UserCheck, 
  AlertTriangle, 
  UploadCloud, 
  Cpu, 
  Bot, 
  Activity 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAdvisor }) {
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'predictor', label: 'Real-Time Predictor', icon: UserCheck },
    { id: 'alerts', label: 'Early-Warning Alerts', icon: AlertTriangle, badge: 'Live' },
    { id: 'batch', label: 'Batch Telemetry CSV', icon: UploadCloud },
    { id: 'models', label: 'Model XAI & Metrics', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                  EduPulse <span className="text-blue-400">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  v2.0 Full-Stack
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Online Learner Engagement & Retention Intelligence
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: AI Tutor / Advisor Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>FastAPI Online</span>
            </div>

            <button
              onClick={onOpenAdvisor}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>AI Advisor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800/60 bg-slate-900/60 space-x-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
