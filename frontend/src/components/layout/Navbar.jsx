import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Train, User, LogOut, LayoutDashboard, Ticket, Bell } from 'lucide-react';
import { toast } from '../../stores/toast.store';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      setShowProfileMenu(false);
      navigate('/');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md text-slate-800 font-sans shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-premium group-hover:scale-105 transition-all">
            <Train className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-primary-950">
            BharatRail
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-650">
          <Link to="/" className="hover:text-secondary-600 transition-colors">
            Search Trains
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/bookings" className="hover:text-secondary-600 transition-colors flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-slate-400" />
                My Bookings
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="hover:text-secondary-600 transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  Admin Control Panel
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Action Controls / Profile */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4 relative">
              
              {/* Notification bell */}
              <button className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                <Bell className="w-4.5 h-4.5" />
              </button>

              {/* User Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700 text-sm font-bold cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-secondary-650 text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.firstName}</span>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white shadow-premium-lg py-2 z-50 animate-slide-in">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-xs text-slate-400 font-semibold">Signed in as</p>
                      <p className="text-sm font-bold text-primary-950 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-650 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-450" />
                      View Profile
                    </Link>
                    <Link
                      to="/bookings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-650 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-slate-450" />
                      My Bookings
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-650 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-450" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-650 hover:bg-red-50 hover:text-red-700 transition-colors text-left border-t border-slate-50 mt-1 cursor-pointer font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-bold text-white bg-secondary-600 hover:bg-secondary-700 transition-all px-4 py-2 rounded-xl shadow-md hover:shadow-secondary-550/20"
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
