import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches React component errors and displays a user-friendly error screen
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Log to localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
      const logs = JSON.parse(localStorage.getItem('regis_error_logs') || '[]');
      logs.push(errorLog);
      // Keep only last 10 errors
      if (logs.length > 10) logs.shift();
      localStorage.setItem('regis_error_logs', JSON.stringify(logs));
    } catch (storageError) {
      console.error('Failed to log error to localStorage:', storageError);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-black text-slate-100">
          <div className="max-w-2xl mx-auto p-10">
            <div className="bg-gradient-to-br from-red-900/40 to-black border border-red-500/50 rounded-3xl p-10 shadow-2xl">
              <div className="flex items-center gap-6 mb-8">
                <div className="p-5 bg-red-500/20 rounded-2xl">
                  <AlertTriangle className="text-red-400" size={48} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-red-400 font-mono">
                    CRITICAL ERROR
                  </h1>
                  <p className="text-slate-300 text-lg mt-2">
                    Application encountered an unexpected error
                  </p>
                </div>
              </div>

              <div className="bg-black/60 rounded-2xl p-6 mb-8 border border-red-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal size={20} className="text-red-400" />
                  <h2 className="text-sm font-bold text-red-300 uppercase tracking-wider">
                    Error Details
                  </h2>
                </div>
                <p className="text-slate-300 font-mono text-sm mb-4 whitespace-pre-wrap break-words">
                  {this.state.error?.toString()}
                </p>
                {this.state.error?.stack && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-slate-400 text-xs hover:text-slate-300 mb-2">
                      Show Stack Trace
                    </summary>
                    <pre className="text-xs text-slate-500 bg-black/50 p-4 rounded-xl overflow-auto max-h-60 border border-white/5">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg"
                >
                  <RefreshCw size={20} />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg"
                >
                  <Terminal size={20} />
                  Reload App
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-6 text-center">
                Error has been logged to browser storage for debugging
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
