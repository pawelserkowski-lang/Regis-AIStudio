/**
 * Logging system for AI services
 */

import type { LogEntry } from "./types";

const LOG_KEY = "regis_ai_logs";
const MAX_LOGS = 500;

const STYLES = {
  INFO: "color: #00ff00",
  WARN: "color: #ffff00",
  ERROR: "color: #ff0000",
  DEBUG: "color: #888888",
};

export function log(
  level: LogEntry["level"],
  source: string,
  message: string,
  data?: unknown
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    data,
  };

  // Console output with styling
  console.log(`%c[${level}] [${source}] ${message}`, STYLES[level], data ?? "");

  // Persist to localStorage
  try {
    const logs: LogEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    logs.push(entry);
    while (logs.length > MAX_LOGS) logs.shift();
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    // Handle storage quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        // Clear oldest half of logs and try again
        const logs: LogEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
        const trimmedLogs = logs.slice(Math.floor(logs.length / 2));
        trimmedLogs.push(entry);
        localStorage.setItem(LOG_KEY, JSON.stringify(trimmedLogs));
        console.warn('Log storage quota exceeded. Cleared old logs.');
      } catch (retryError) {
        // If still failing, clear all logs
        try {
          localStorage.removeItem(LOG_KEY);
          localStorage.setItem(LOG_KEY, JSON.stringify([entry]));
        } catch {
          // Give up silently
        }
      }
    }
    // Ignore other storage errors
  }
}

export function getLogs(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearLogs(): void {
  localStorage.removeItem(LOG_KEY);
}
