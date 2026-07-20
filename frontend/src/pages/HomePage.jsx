import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useSearchStore } from '../stores/search.store';
import { bookingApi } from '../api/booking.api';
import SearchForm from '../components/search/SearchForm';
import { formatDate, formatPNR } from '../utils/format';
import { ShieldCheck, Award, Zap, ArrowRight, Calendar } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { searchHistory, setQuery, executeSearch } = useSearchStore();
  const [recentBookings, setRecentBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      bookingApi.list(null, 1, 3)
        .then((res) => {
          const list = res.data?.bookings || res.bookings || [];
          setRecentBookings(list.slice(0, 3));
        })
        .catch((err) => {
          console.error('Failed to load recent bookings:', err);
        });
    }
  }, [isAuthenticated]);

  const handleRecentSearchClick = async (search) => {
    try {
      setQuery({
        from: search.from,
        to: search.to,
        date: search.date
      });
      await executeSearch();
      navigate('/search');
    } catch (err) {
      console.error('Failed to execute search from history:', err);
    }
  };

  const handlePopularRouteClick = async (fromCode, fromName, toCode, toName) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      setQuery({
        from: { code: fromCode, name: fromName },
        to: { code: toCode, name: toName },
        date: today
      });
      await executeSearch();
      navigate('/search');
    } catch (err) {
      console.error('Failed to search popular route:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col font-sans -mt-6">
      
      {/* Hero Banner Section */}
      <div className="relative w-full bg-gradient-to-r from-primary-950 via-primary-900 to-secondary-800 text-white py-16 px-4 md:px-8 overflow-hidden rounded-b-[40px] shadow-lg">
        {/* Glow decorative vectors */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary-500/15 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight">
            Book Your Next Journey
          </h1>
          <p className="text-secondary-100/95 text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Search trains across India with real-time availability and secure online booking.
          </p>

          {/* Search Card Frame */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-premium-lg text-slate-800 border border-slate-100 max-w-4xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="max-w-5xl mx-auto px-4 w-full py-12 flex flex-col gap-10">
        
        {/* Search History Panel */}
        {searchHistory && searchHistory.length > 0 && (
          <div className="animate-slide-in">
            <h3 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase mb-4 pl-0.5">
              Your Recent Searches
            </h3>
            <div className="flex flex-wrap gap-3">
              {searchHistory.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentSearchClick(search)}
                  className="flex items-center gap-2 bg-white border border-slate-150 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:text-secondary-600 hover:border-secondary-300 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{search.from.code} → {search.to.code}</span>
                  <span className="text-slate-400 font-semibold">• {formatDate(search.date)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div>
          <h3 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase mb-4 pl-0.5">
            Why Book With Us
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium flex items-start gap-4">
              <div className="p-3 bg-secondary-50 rounded-2xl text-secondary-650 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-primary-950 mb-1">Instant Hold Systems</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automatically holds your seats for 10 minutes to secure selections while finalizing payments.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium flex items-start gap-4">
              <div className="p-3 bg-accent-50 rounded-2xl text-accent-600 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-primary-950 mb-1">Secure Transactions</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Industry standard security protocols protect your transaction histories and personal records.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-2xl text-green-600 flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-primary-950 mb-1">Hassle-Free Cancellations</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Need to change plans? Trigger one-click ticket cancellations directly with quick refund updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Routes Panel */}
        <div>
          <h3 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase mb-4 pl-0.5">
            Popular Train Routes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { fromCode: 'NDLS', fromName: 'New Delhi', toCode: 'BCT', toName: 'Mumbai Central' },
              { fromCode: 'HWH', fromName: 'Howrah Junction', toCode: 'NDLS', toName: 'New Delhi' },
              { fromCode: 'SBC', fromName: 'KSR Bengaluru', toCode: 'MAS', toName: 'Chennai Central' },
              { fromCode: 'NDLS', fromName: 'New Delhi', toCode: 'PNBE', toName: 'Patna Junction' },
            ].map((route, i) => (
              <button
                key={i}
                onClick={() => handlePopularRouteClick(route.fromCode, route.fromName, route.toCode, route.toName)}
                className="bg-white border border-slate-100 hover:border-secondary-200 rounded-2xl p-4 shadow-sm text-left transition-all hover:scale-[1.02] cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  <span>{route.fromCode}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  <span>{route.toCode}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-secondary-650 transition-colors">
                  {route.fromName} to {route.toName}
                </h4>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Bookings List if authenticated */}
        {isAuthenticated && recentBookings.length > 0 && (
          <div className="animate-slide-in">
            <div className="flex items-center justify-between mb-4 px-0.5">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                Your Recent Bookings
              </h3>
              <Link to="/bookings" className="text-xs font-bold text-secondary-600 hover:underline">
                View all bookings
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-slate-800 text-sm">{b.trainName}</span>
                      <span className="text-xs text-slate-400 font-semibold">#{b.trainNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                      <span>PNR: {formatPNR(b.id)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(b.departureDate || b.journeyDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status</p>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5
                        ${
                          b.status === 'CONFIRMED'
                            ? 'bg-green-50 text-green-700'
                            : b.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <Link
                      to={`/bookings/${b.id}`}
                      className="px-4 py-2 text-xs font-bold border border-slate-200 hover:border-secondary-500 text-slate-600 hover:text-secondary-650 rounded-xl transition-all shadow-sm"
                    >
                      Manage Ticket
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
