import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 font-sans bg-slate-50">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-600 mb-6 shadow-sm animate-pulse">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-primary-950 mb-2 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="max-w-md text-slate-500 mb-8 text-sm sm:text-base leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-secondary-500/20 text-sm cursor-pointer"
      >
        <Home className="w-4 h-4" />
        Return Home
      </Link>
    </div>
  );
}
