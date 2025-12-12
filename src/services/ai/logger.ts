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
  } catch {
    // Ignore storage errors
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
