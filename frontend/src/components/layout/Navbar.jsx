import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Train, User, LogOut, LayoutDashboard, Ticket } from 'lucide-react';
import { toast } from '../../stores/toast.store';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md text-slate-100 font-sans">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-md group-hover:scale-105 transition-all">
            <Train className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            BharatRail
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link to="/" className="hover:text-white transition-colors">
            Search Trains
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/bookings" className="hover:text-white transition-colors flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-slate-400" />
                My Bookings
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  Admin Dashboard
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-semibold hover:bg-slate-850 hover:border-slate-750 transition-all text-slate-200 hover:text-white"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span className="max-w-[120px] truncate">{user?.firstName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-900/30"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-350 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-all px-4 py-2 rounded-2xl shadow-lg hover:shadow-primary-500/25"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
