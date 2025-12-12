/**
 * System utilities for backend communication and logging
 * These are system-level utilities, not AI-specific
 */

// --- NETWORK CONFIGURATION ---
// Bypass Vite proxy, connect directly to Python backend
const API_URL = "http://127.0.0.1:8000";
// -----------------------------

export interface LogEntry {
  id: string;
  timestamp: number;
  uptime: string;
  module: string;
  action: string;
  status: string;
  data?: any;
}

let logHistory: LogEntry[] = [];
try {
    const saved = localStorage.getItem('regis_system_logs');
    logHistory = saved ? JSON.parse(saved) : [];
} catch {
    logHistory = [];
}

const SYSTEM_START = Date.now();

/**
 * Log system events
 */
export const systemLog = (module: string, action: string, status: string, data?: any): LogEntry => {
  const entry: LogEntry = {
      id: Math.random().toString(),
      timestamp: Date.now(),
      uptime: ((Date.now() - SYSTEM_START) / 1000).toFixed(3),
      module,
      action,
      status,
      data
  };

  logHistory.unshift(entry);
  if (logHistory.length > 200) logHistory.pop();

  try {
    localStorage.setItem('regis_system_logs', JSON.stringify(logHistory));
  } catch (error) {
    console.error('Failed to save system logs:', error);
  }

  return entry;
};

/**
 * Get system log history
 */
export const getLogs = (): LogEntry[] => logHistory;

/**
 * Clear system logs
 */
export const clearSystemLogs = (): void => {
  logHistory = [];
  localStorage.removeItem('regis_system_logs');
};

/**
 * Execute system action via backend API with timeout protection
 */
export const executeSystemAction = async (action: string, payload: Record<string, any> = {}): Promise<any> => {
    systemLog('SYS', action, 'REQ', payload);

    // Timeout protection: 30 seconds max for system actions
    const SYSTEM_ACTION_TIMEOUT = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYSTEM_ACTION_TIMEOUT);

    try {
        const res = await fetch(`${API_URL}/api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        systemLog('SYS', action, data.error ? 'ERR' : 'RES', data);

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        let message = error instanceof Error ? error.message : String(error);

        // Handle timeout specifically
        if (error instanceof Error && error.name === 'AbortError') {
            message = `Request timeout (30s) for action: ${action}`;
        }

        systemLog('SYS', action, 'FAIL', message);
        console.error("System Action Failed:", error);
        throw new Error(message);
    }
};

/**
 * Auto-curate registry items from text
 * TODO: Implement proper AI-based curation
 */
export const autoCurateRegistry = async (text: string): Promise<{ title: string; content: string; tags: string[] } | null> => {
  // Placeholder: Extract first line as title
  if (!text || text.length < 20) return null;

  const lines = text.split('\n').filter(l => l.trim());
  const title = lines[0]?.substring(0, 50) || 'Untitled';

  return {
    title,
    content: text.substring(0, 500),
    tags: ['auto-saved']
  };
};

/**
 * Generate title for registry content
 * TODO: Implement AI-based title generation
 */
export const generateTitleForRegistry = async (content: string): Promise<string> => {
  const lines = content.split('\n').filter(l => l.trim());
  return lines[0]?.substring(0, 50) || 'Untitled';
};
