import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Cpu, Database, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Performance Monitoring Dashboard
 * Real-time tracking of API usage, response times, and system health
 */

interface MetricData {
  timestamp: number;
  value: number;
}

interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  tokensUsed: number;
  estimatedCost: number;
  errorRate: number;
  activeConnections: number;
}

interface PerformanceHistory {
  responseTimes: MetricData[];
  memoryUsage: MetricData[];
  requestRate: MetricData[];
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<APIMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    tokensUsed: 0,
    estimatedCost: 0,
    errorRate: 0,
    activeConnections: 0,
  });

  const [history, setHistory] = useState<PerformanceHistory>({
    responseTimes: [],
    memoryUsage: [],
    requestRate: [],
  });

  const [isMonitoring, setIsMonitoring] = useState(true);

  // Track performance metrics from localStorage
  useEffect(() => {
    const updateMetrics = () => {
      try {
        // Get stored performance data
        const perfData = localStorage.getItem('regis_performance_metrics');
        if (perfData) {
          const data = JSON.parse(perfData);
          setMetrics(prev => ({
            ...prev,
            ...data,
            errorRate: data.totalRequests > 0
              ? ((data.failedRequests / data.totalRequests) * 100).toFixed(2)
              : 0,
          }));
        }

        // Update history
        const now = Date.now();
        setHistory(prev => ({
          responseTimes: [
            ...prev.responseTimes,
            { timestamp: now, value: metrics.averageResponseTime }
          ].slice(-20),
          memoryUsage: [
            ...prev.memoryUsage,
            { timestamp: now, value: getMemoryUsage() }
          ].slice(-20),
          requestRate: [
            ...prev.requestRate,
            { timestamp: now, value: metrics.totalRequests }
          ].slice(-20),
        }));
      } catch (error) {
        console.error('Failed to update metrics:', error);
      }
    };

    if (isMonitoring) {
      updateMetrics();
      const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isMonitoring, metrics.averageResponseTime, metrics.totalRequests]);

  // Monitor memory usage (approximate)
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
    }
    return 0;
  }, []);

  // Track API calls globally
  useEffect(() => {
    // Hook into fetch to track API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const isAPICall = args[0]?.toString().includes('/api/');

      if (isAPICall) {
        setMetrics(prev => ({
          ...prev,
          activeConnections: prev.activeConnections + 1,
        }));
      }

      try {
        const response = await originalFetch(...args);
        const responseTime = Date.now() - startTime;

        if (isAPICall) {
          updateAPIMetrics(response.ok, responseTime);
        }

        return response;
      } catch (error) {
        if (isAPICall) {
          updateAPIMetrics(false, Date.now() - startTime);
        }
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const updateAPIMetrics = (success: boolean, responseTime: number) => {
    setMetrics(prev => {
      const newMetrics = {
        totalRequests: prev.totalRequests + 1,
        successfulRequests: success ? prev.successfulRequests + 1 : prev.successfulRequests,
        failedRequests: !success ? prev.failedRequests + 1 : prev.failedRequests,
        averageResponseTime: Math.round(
          (prev.averageResponseTime * prev.totalRequests + responseTime) / (prev.totalRequests + 1)
        ),
        tokensUsed: prev.tokensUsed,
        estimatedCost: prev.estimatedCost,
        errorRate: 0,
        activeConnections: Math.max(0, prev.activeConnections - 1),
      };

      // Store in localStorage
      try {
        localStorage.setItem('regis_performance_metrics', JSON.stringify(newMetrics));
      } catch (error) {
        console.error('Failed to save metrics:', error);
      }

      return newMetrics;
    });
  };

  const resetMetrics = () => {
    if (confirm('Reset all performance metrics?')) {
      setMetrics({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        tokensUsed: 0,
        estimatedCost: 0,
        errorRate: 0,
        activeConnections: 0,
      });
      localStorage.removeItem('regis_performance_metrics');
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down' | 'stable';
  }> = ({ title, value, icon, color, trend }) => (
    <div className={`bg-black/40 backdrop-blur-xl rounded-xl p-4 border ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{title}</span>
        <span className={`${color.replace('border-', 'text-')}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {trend && (
        <div className={`text-xs flex items-center gap-1 ${
          trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-yellow-400'
        }`}>
          <TrendingUp className="w-3 h-3" />
          <span>{trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}</span>
        </div>
      )}
    </div>
  );

  const MiniChart: React.FC<{ data: MetricData[]; color: string; label: string }> = ({ data, color, label }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.value / max) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-black/30 rounded-xl p-4">
        <div className="text-sm text-slate-400 mb-2">{label}</div>
        <svg viewBox="0 0 100 50" className="w-full h-20">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="transition-all duration-300"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white font-mono p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            Performance Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time system and API performance tracking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-2 rounded-lg transition-all ${
              isMonitoring
                ? 'bg-green-600/20 border border-green-500/50 text-green-300'
                : 'bg-red-600/20 border border-red-500/50 text-red-300'
            }`}
          >
            {isMonitoring ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            onClick={resetMetrics}
            className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/50 text-red-300 hover:bg-red-600/30 transition-all"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests}
          icon={<Activity className="w-5 h-5" />}
          color="border-blue-500/50"
          trend="up"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.averageResponseTime}ms`}
          icon={<Clock className="w-5 h-5" />}
          color="border-green-500/50"
          trend="stable"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.totalRequests > 0 ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1) : 0}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="border-green-500/50"
          trend="up"
        />
        <MetricCard
          title="Active Connections"
          value={metrics.activeConnections}
          icon={<Database className="w-5 h-5" />}
          color="border-purple-500/50"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Failed Requests"
          value={metrics.failedRequests}
          icon={<AlertCircle className="w-5 h-5" />}
          color="border-red-500/50"
        />
        <MetricCard
          title="Error Rate"
          value={`${typeof metrics.errorRate === 'number' ? metrics.errorRate : 0}%`}
          icon={<AlertCircle className="w-5 h-5" />}
          color="border-yellow-500/50"
        />
        <MetricCard
          title="Memory Usage"
          value={`${getMemoryUsage()}%`}
          icon={<Cpu className="w-5 h-5" />}
          color="border-cyan-500/50"
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MiniChart
          data={history.responseTimes}
          color="#10b981"
          label="Response Time Trend"
        />
        <MiniChart
          data={history.memoryUsage}
          color="#06b6d4"
          label="Memory Usage Trend"
        />
        <MiniChart
          data={history.requestRate}
          color="#8b5cf6"
          label="Request Rate Trend"
        />
      </div>

      {/* Cost Tracking */}
      <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
        <h2 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
          <span>💰</span> API Usage & Costs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Tokens Used</div>
            <div className="text-2xl font-bold text-purple-400">{metrics.tokensUsed.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Approximate count</div>
          </div>
          <div className="bg-black/30 p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Estimated Cost</div>
            <div className="text-2xl font-bold text-green-400">${metrics.estimatedCost.toFixed(4)}</div>
            <div className="text-xs text-slate-500 mt-1">Based on current usage</div>
          </div>
          <div className="bg-black/30 p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Avg Cost/Request</div>
            <div className="text-2xl font-bold text-yellow-400">
              ${metrics.totalRequests > 0 ? (metrics.estimatedCost / metrics.totalRequests).toFixed(4) : '0.0000'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Per API call</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-slate-600">
        <p>Metrics updated every 5 seconds • Data stored in localStorage</p>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
