import { useToastStore } from '../../stores/toast.store';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => {
        let bgColor = 'bg-blue-50/95 text-blue-900 border-blue-200';
        let Icon = Info;
        let iconColor = 'text-blue-600';

        if (t.type === 'success') {
          bgColor = 'bg-green-50/95 text-green-900 border-green-200';
          Icon = CheckCircle2;
          iconColor = 'text-green-600';
        } else if (t.type === 'error') {
          bgColor = 'bg-red-50/95 text-red-900 border-red-200';
          Icon = AlertTriangle;
          iconColor = 'text-red-600';
        }

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-premium-lg pointer-events-auto transition-all duration-300 transform translate-x-0 animate-slide-in ${bgColor}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-semibold">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-650 transition-colors flex-shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
