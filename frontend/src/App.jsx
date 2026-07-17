import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes';
import { useAuthStore } from './stores/auth.store';

export default function App() {
  const { initializeAuth, logout } = useAuthStore();

  useEffect(() => {
    // Check if the user is authenticated (reads cookies) on app launch
    initializeAuth();

    // Register a global event listener to trigger client logout eviction
    const handleGlobalLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleGlobalLogout);

    return () => {
      window.removeEventListener('auth:logout', handleGlobalLogout);
    };
  }, [initializeAuth, logout]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
