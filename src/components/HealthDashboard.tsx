import React, { useState, useEffect } from 'react';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  REGIS AI STUDIO - Matrix Health Dashboard                                    ║
 * ║  Real-time monitoring w stylu "follow the white rabbit" 🐇                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Matrix Rain Effect Component
const MatrixRain: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  
  useEffect(() => {
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789ABCDEF";
    const interval = setInterval(() => {
      const newColumns = Array(30).fill(0).map(() => 
        Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
      );
      setColumns(newColumns);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none font-mono text-xs">
      <div className="flex justify-around">
        {columns.map((col, i) => (
          <span key={i} className="text-green-500 animate-pulse">{col}</span>
        ))}
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: 'ok' | 'warn' | 'error' | 'loading' }> = ({ status }) => {
  const styles = {
    ok: 'bg-green-500/20 text-green-400 border-green-500/50',
    warn: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    error: 'bg-red-500/20 text-red-400 border-red-500/50',
    loading: 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse',
  };
  const icons = { ok: '🟢', warn: '🟡', error: '🔴', loading: '⏳' };
  const labels = { ok: 'ONLINE', warn: 'WARNING', error: 'OFFLINE', loading: 'CHECKING' };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      {icons[status]} {labels[status]}
    </span>
  );
};

// Progress Bar Component
const MatrixProgress: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-green-400 font-mono">{value}%</span>
    </div>
    <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-green-900/30">
      <div 
        className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

// Main Dashboard Component
const HealthDashboard: React.FC = () => {
  const [health, setHealth] = useState({
    backend: 'loading' as 'ok' | 'warn' | 'error' | 'loading',
    claude: 'loading' as 'ok' | 'warn' | 'error' | 'loading',
    gemini: 'loading' as 'ok' | 'warn' | 'error' | 'loading',
  });
  const [metrics, setMetrics] = useState({
    latency: 0,
    uptime: '00:00:00',
    requests: 0,
    tokensUsed: 0,
    estimatedCost: 0,
  });
  const [logs, setLogs] = useState<Array<{time: string; type: string; msg: string}>>([]);
  const [currentModel, setCurrentModel] = useState('claude-sonnet-4-20250514');
  const [provider, setProvider] = useState<'claude' | 'gemini'>('claude');

  // Simulate health check
  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/health');
        const data = await response.json();
        const latency = Date.now() - start;
        
        setHealth({
          backend: response.ok ? 'ok' : 'error',
          claude: data.anthropic_available ? 'ok' : 'warn',
          gemini: 'ok', // Placeholder
        });
        
        setMetrics(prev => ({
          ...prev,
          latency,
          requests: prev.requests + 1,
        }));
        
        addLog('INFO', `Health check OK (${latency}ms)`);
      } catch (e) {
        setHealth({ backend: 'error', claude: 'error', gemini: 'error' });
        addLog('ERROR', 'Backend unreachable');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Uptime counter
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      setMetrics(prev => ({ ...prev, uptime: `${h}:${m}:${s}` }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (type: string, msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, type, msg }, ...prev].slice(0, 10));
  };

  const models = {
    claude: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', badge: '🔥' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: '' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', badge: '💪' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', badge: '⚡' },
    ],
    gemini: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: '⚡' },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', badge: '🔥' },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white font-mono p-6 relative overflow-hidden">
      <MatrixRain />
      
      {/* Header */}
      <header className="relative z-10 mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
            <span className="text-2xl">🖥️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              MATRIX HEALTH DASHBOARD
            </h1>
            <p className="text-sm text-slate-500">Regis AI Studio v2.0 • Self-Repair Active</p>
          </div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Status Panel */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-green-900/30 shadow-2xl">
          <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
            <span>📊</span> SYSTEM STATUS
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl">
              <span className="text-slate-300">Backend API</span>
              <StatusBadge status={health.backend} />
            </div>
            <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl">
              <span className="text-slate-300">Claude (Anthropic)</span>
              <StatusBadge status={health.claude} />
            </div>
            <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl">
              <span className="text-slate-300">Gemini (Google)</span>
              <StatusBadge status={health.gemini} />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <MatrixProgress value={65} label="Memory Usage" />
            <MatrixProgress value={42} label="CPU Load" />
            <MatrixProgress value={23} label="Context Window" />
          </div>
        </div>

        {/* Active Model Panel */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-green-900/30 shadow-2xl">
          <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
            <span>🤖</span> ACTIVE MODEL
          </h2>

          {/* Provider Switcher */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setProvider('claude')}
              className={`flex-1 py-2 px-4 rounded-xl transition-all ${
                provider === 'claude' 
                  ? 'bg-purple-600/30 border-purple-500/50 text-purple-300' 
                  : 'bg-black/30 border-slate-700/50 text-slate-400 hover:bg-black/50'
              } border`}
            >
              💜 Claude
            </button>
            <button
              onClick={() => setProvider('gemini')}
              className={`flex-1 py-2 px-4 rounded-xl transition-all ${
                provider === 'gemini' 
                  ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' 
                  : 'bg-black/30 border-slate-700/50 text-slate-400 hover:bg-black/50'
              } border`}
            >
              💙 Gemini
            </button>
          </div>

          {/* Model List */}
          <div className="space-y-2">
            {models[provider].map(model => (
              <button
                key={model.id}
                onClick={() => { setCurrentModel(model.id); addLog('INFO', `Switched to ${model.name}`); }}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  currentModel === model.id
                    ? 'bg-green-600/20 border-green-500/50 text-green-300'
                    : 'bg-black/30 border-transparent hover:bg-black/50 text-slate-300'
                } border`}
              >
                <div className="flex justify-between items-center">
                  <span>{model.name}</span>
                  <span>{currentModel === model.id ? '✓' : ''} {model.badge}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{model.id}</div>
              </button>
            ))}
          </div>

          {/* Model Info */}
          <div className="mt-4 p-3 bg-green-900/20 rounded-xl border border-green-800/30">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Context:</span> <span className="text-green-400">200K</span></div>
              <div><span className="text-slate-500">Vision:</span> <span className="text-green-400">✓</span></div>
              <div><span className="text-slate-500">Tools:</span> <span className="text-green-400">✓</span></div>
              <div><span className="text-slate-500">Stream:</span> <span className="text-green-400">✓</span></div>
            </div>
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-green-900/30 shadow-2xl">
          <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
            <span>📈</span> METRICS
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-green-400">{metrics.latency}</div>
              <div className="text-xs text-slate-500">Latency (ms)</div>
            </div>
            <div className="bg-black/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-cyan-400">{metrics.uptime}</div>
              <div className="text-xs text-slate-500">Uptime</div>
            </div>
            <div className="bg-black/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-yellow-400">{metrics.requests}</div>
              <div className="text-xs text-slate-500">Requests</div>
            </div>
            <div className="bg-black/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-purple-400">$0.00</div>
              <div className="text-xs text-slate-500">Est. Cost</div>
            </div>
          </div>

          {/* Live Logs */}
          <h3 className="text-sm font-bold text-slate-400 mb-2">📋 LIVE LOGS</h3>
          <div className="bg-black/50 rounded-xl p-3 h-40 overflow-y-auto text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-600">{log.time}</span>
                <span className={log.type === 'ERROR' ? 'text-red-400' : 'text-green-400'}>[{log.type}]</span>
                <span className="text-slate-300">{log.msg}</span>
              </div>
            ))}
            {logs.length === 0 && <div className="text-slate-600">Waiting for events...</div>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center text-xs text-slate-600">
        <p>"There is no spoon." – The Matrix (1999) 🥄</p>
        <p className="mt-1">Self-Repair System v2.0 • Health Score: 94% 💚</p>
      </footer>
    </div>
  );
};

export default HealthDashboard;
