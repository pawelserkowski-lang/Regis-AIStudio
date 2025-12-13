// ==========================================
// Tissaia - Logging System
// ==========================================

import { TissaiaLogEntry, LogLevel, LogModule } from './types';
import { systemLog } from '../systemUtils';

class TissaiaLogger {
  private logs: TissaiaLogEntry[] = [];
  private subscribers: ((entry: TissaiaLogEntry) => void)[] = [];

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private log(level: LogLevel, module: LogModule, message: string, data?: any): TissaiaLogEntry {
    const entry: TissaiaLogEntry = {
      timestamp: new Date(),
      level,
      module,
      message,
      data
    };

    this.logs.push(entry);

    // Keep only last 500 logs
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500);
    }

    // Console output with formatting
    const timeStr = this.formatTime(entry.timestamp);
    const levelColor = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m'    // Red
    }[level];

    console.log(`[${timeStr}] ${levelColor}${level}\x1b[0m [${module}] ${message}`);
    if (data) {
      console.log('  Data:', data);
    }

    // Also log to system logs for UI display
    systemLog(module, message, level, data);

    // Notify subscribers
    this.subscribers.forEach(callback => callback(entry));

    return entry;
  }

  info(module: LogModule, message: string, data?: any): TissaiaLogEntry {
    return this.log('INFO', module, message, data);
  }

  success(module: LogModule, message: string, data?: any): TissaiaLogEntry {
    return this.log('SUCCESS', module, message, data);
  }

  warn(module: LogModule, message: string, data?: any): TissaiaLogEntry {
    return this.log('WARN', module, message, data);
  }

  error(module: LogModule, message: string, data?: any): TissaiaLogEntry {
    return this.log('ERROR', module, message, data);
  }

  getLogs(): TissaiaLogEntry[] {
    return [...this.logs];
  }

  subscribe(callback: (entry: TissaiaLogEntry) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  clear(): void {
    this.logs = [];
  }
}

export const tissaiaLogger = new TissaiaLogger();
export default tissaiaLogger;
