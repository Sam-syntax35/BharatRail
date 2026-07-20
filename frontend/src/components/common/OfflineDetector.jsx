import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-red-50 text-red-800 py-2.5 px-4 text-center font-bold text-sm flex items-center justify-center gap-2 border-b border-red-100 shadow-sm animate-pulse z-50 relative">
      <WifiOff className="w-4 h-4 text-red-500" />
      <span>You are currently offline. Some features may not work properly until you reconnect.</span>
    </div>
  );
}
