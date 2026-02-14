import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Log error to console or monitoring service
    console.error("Uncaught error:", error, errorInfo);
    
    // Optional: report to monitoring service (reusing logic from axios.js if needed)
    if (window.reportToMonitoring) {
        window.reportToMonitoring('frontend_runtime_error', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={40} />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Oops, Terjadi Kesalahan!</h2>
            <p className="mb-8 text-slate-500">
              Aplikasi mengalami masalah saat memuat halaman ini. Jangan khawatir, data Anda tetap aman.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 hover:bg-accent transition-all"
              >
                <RotateCcw size={18} />
                Muat Ulang Halaman
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Home size={18} />
                Kembali ke Beranda
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 overflow-hidden rounded-xl bg-slate-900 p-4 text-left">
                <p className="text-xs font-mono text-red-400 truncate">{this.state.error.toString()}</p>
                <pre className="mt-2 max-h-40 overflow-auto text-[10px] font-mono text-slate-400">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
