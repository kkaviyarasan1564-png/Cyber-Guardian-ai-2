import React, { useState } from 'react';
import { X, Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function AdvisorChatModal({ isOpen, onClose, studentContext }) {
  if (!isOpen) return null;

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: studentContext
        ? `Hello! I'm your AI Pedagogical Advisor. I'm currently reviewing **Student ${studentContext.student_id || 'Selected'}** (${studentContext.predicted_engagement_level || 'Moderate'} engagement risk). How can I assist with this student's intervention strategy?`
        : "Hello! I'm your EduPulse AI Pedagogical Advisor. You can ask me about identifying student dropout risk, crafting personalized outreach emails, or structuring remediation plans."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/api/chat/advisor', {
        message: userText,
        student_context: studentContext
      });

      setMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "Sorry, I had trouble connecting to the advisory server. Please check the backend." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl glass-card rounded-2xl border border-slate-700 bg-slate-950 flex flex-col h-[520px] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>EduPulse AI Pedagogical Advisor</span>
                <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 text-[10px] rounded-full border border-blue-500/30">
                  Assistant
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Context: {studentContext?.student_id || 'General Platform Insights'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-900/40 flex overflow-x-auto space-x-2">
          <button
            onClick={() => setInput("Why is this student predicted as at-risk?")}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap transition-all"
          >
            🔍 Explain Risk Factors
          </button>
          <button
            onClick={() => setInput("Draft a personalized check-in email for this student")}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap transition-all"
          >
            📧 Draft Check-In Email
          </button>
          <button
            onClick={() => setInput("What pedagogical interventions do you recommend?")}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap transition-all"
          >
            🛠️ Recommend Action Plan
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'bot' && (
                <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
              {m.sender === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>EduPulse AI is generating recommendation...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask AI advisor for custom outreach, quiz review tips, or root causes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
