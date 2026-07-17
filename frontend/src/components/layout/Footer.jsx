import { Train } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 text-sm font-sans">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Train className="h-5 w-5 text-accent-500" />
          <span className="font-bold text-white">BharatRail Enterprise</span>
        </div>
        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} BharatRail Reservation System. All rights reserved. Under licensing with IRCTC.
        </p>
      </div>
    </footer>
  );
}
