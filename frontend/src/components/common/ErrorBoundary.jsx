import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-md w-full text-center bg-white border border-slate-100 rounded-3xl p-8 shadow-premium-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-100 text-red-600 mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-extrabold mb-3 tracking-tight text-primary-950">Something went wrong</h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              An unexpected rendering error occurred. We apologize for the inconvenience. Let's try reloading the application.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left max-h-32 overflow-auto">
                <code className="text-xs text-red-650 font-mono block whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-secondary-500/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
