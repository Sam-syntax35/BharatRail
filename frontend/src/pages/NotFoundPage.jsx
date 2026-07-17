import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 font-sans">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-accent-500 mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="max-w-md text-slate-400 mb-8 text-sm sm:text-base leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-5 rounded-2xl transition-all shadow-lg hover:shadow-primary-500/25 text-sm"
      >
        <Home className="w-4 h-4" />
        Return Home
      </Link>
    </div>
  );
}
