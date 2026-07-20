import { useState } from 'react';
import { useSearchStore } from '../stores/search.store';
import SearchForm from '../components/search/SearchForm';
import TrainCard from '../components/search/TrainCard';
import { RefreshCw, Filter, SlidersHorizontal, Train } from 'lucide-react';
import { formatDate } from '../utils/format';

export default function SearchPage() {
  const { searchResults, isLoading, error, executeSearch } = useSearchStore();
  const [sortBy, setSortBy] = useState('departure'); // departure | duration | price

  // Advanced filter states
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);
  const [classFilter, setClassFilter] = useState('ALL'); // ALL | AC | SLEEPER
  const [timeFilter, setTimeFilter] = useState('ALL'); // ALL | MORNING (06-12) | AFTERNOON (12-18) | EVENING (18-24) | NIGHT (00-06)
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | RAJDHANI | EXPRESS | SUPERFAST
  const [maxFare, setMaxFare] = useState(3000);

  const handleRetry = async () => {
    try {
      await executeSearch();
    } catch (err) {
      console.error('Failed to retry search:', err);
    }
  };

  const handleResetFilters = () => {
    setFilterAvailableOnly(false);
    setClassFilter('ALL');
    setTimeFilter('ALL');
    setTypeFilter('ALL');
    setSortBy('departure');
    setMaxFare(3000);
  };

  // Helper to parse time strings "HH:MM" to minutes from start of day
  const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Helper to compute travel duration in minutes
  const getDuration = (train) => {
    const dep = getMinutes(train.from?.departure);
    let arr = getMinutes(train.to?.arrival);
    if (arr < dep) arr += 24 * 60; // Next day arrival
    return arr - dep;
  };

  // Dynamic fare estimator to mirror card fares
  const getEstimatedLowestPrice = (train) => {
    const seatSummary = train.seatSummary || {};
    let minPrice = Infinity;
    const prices = { LOWER: 550, MIDDLE: 520, UPPER: 500, SIDE_LOWER: 540, SIDE_UPPER: 480 };
    Object.keys(seatSummary).forEach((type) => {
      if (type !== 'total' && seatSummary[type] > 0) {
        const est = prices[type] || 450;
        if (est < minPrice) minPrice = est;
      }
    });
    return minPrice === Infinity ? 450 : minPrice;
  };

  // Filter and sort logic
  const getProcessedTrains = () => {
    if (!searchResults?.trains) return [];

    let list = [...searchResults.trains];

    // 1. Availability Filter
    if (filterAvailableOnly) {
      list = list.filter((t) => (t.schedule?.available || 0) > 0);
    }

    // 2. Class Filter
    if (classFilter !== 'ALL') {
      list = list.filter((t) => {
        const coach = (t.coachName || '').toUpperCase();
        if (classFilter === 'AC') return coach.includes('AC') || t.trainName.toLowerCase().includes('rajdhani');
        if (classFilter === 'SLEEPER') return !coach.includes('AC') && !t.trainName.toLowerCase().includes('rajdhani');
        return true;
      });
    }

    // 3. Departure Time Filter
    if (timeFilter !== 'ALL') {
      list = list.filter((t) => {
        const mins = getMinutes(t.from?.departure);
        if (timeFilter === 'NIGHT') return mins >= 0 && mins < 360; // 00:00 - 06:00
        if (timeFilter === 'MORNING') return mins >= 360 && mins < 720; // 06:00 - 12:00
        if (timeFilter === 'AFTERNOON') return mins >= 720 && mins < 1080; // 12:00 - 18:00
        if (timeFilter === 'EVENING') return mins >= 1080 && mins <= 1440; // 18:00 - 24:00
        return true;
      });
    }

    // 4. Train Type Filter
    if (typeFilter !== 'ALL') {
      list = list.filter((t) => {
        const lower = (t.trainName || '').toLowerCase();
        if (typeFilter === 'RAJDHANI') return lower.includes('rajdhani');
        if (typeFilter === 'EXPRESS') return lower.includes('express');
        if (typeFilter === 'SUPERFAST') return !lower.includes('express') && !lower.includes('rajdhani');
        return true;
      });
    }

    // 5. Max Fare Filter
    list = list.filter((t) => {
      const fare = getEstimatedLowestPrice(t);
      return fare <= maxFare;
    });

    // 6. Sort Logic
    list.sort((a, b) => {
      if (sortBy === 'departure') {
        return getMinutes(a.from?.departure) - getMinutes(b.from?.departure);
      }
      if (sortBy === 'duration') {
        return getDuration(a) - getDuration(b);
      }
      if (sortBy === 'price') {
        return getEstimatedLowestPrice(a) - getEstimatedLowestPrice(b);
      }
      return 0;
    });

    return list;
  };

  const processedTrains = getProcessedTrains();

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans">

      {/* Top Banner Search Widget Container */}
      <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-premium">
        <SearchForm compact />
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Side: Filter Controls */}
        <aside className="lg:col-span-3 bg-white border border-slate-150 rounded-3xl p-5 shadow-premium flex flex-col gap-5 sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-primary-950 flex items-center gap-1.5 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-secondary-600" />
              Filter & Sort
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-extrabold text-secondary-600 hover:text-secondary-700 bg-secondary-50 border border-secondary-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {/* Sorting Method */}
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 pl-0.5">Sort by</h4>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Departure Time', value: 'departure' },
                { label: 'Travel Duration', value: 'duration' },
                { label: 'Base Fare Price', value: 'price' }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setSortBy(item.value)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all duration-200 text-left w-full
                    ${sortBy === item.value
                      ? 'border-secondary-500 bg-secondary-50/40 text-secondary-700'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                    }`}
                >
                  <span>{item.label}</span>
                  {sortBy === item.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Coach Class Filter */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 pl-0.5">Class</h4>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'AC', value: 'AC' },
                { label: 'Sleeper', value: 'SLEEPER' }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setClassFilter(item.value)}
                  className={`py-2 px-1 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer
                    ${classFilter === item.value
                      ? 'border-secondary-500 bg-secondary-50/40 text-secondary-700'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-500'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Departure Time Filter */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 pl-0.5">Departure Time</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Early Morning (0-6)', value: 'NIGHT' },
                { label: 'Morning (6-12)', value: 'MORNING' },
                { label: 'Afternoon (12-18)', value: 'AFTERNOON' },
                { label: 'Evening (18-24)', value: 'EVENING' }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setTimeFilter(timeFilter === item.value ? 'ALL' : item.value)}
                  className={`py-2 px-1 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer leading-tight
                    ${timeFilter === item.value
                      ? 'border-secondary-500 bg-secondary-50/40 text-secondary-700'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-500'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Train Type Filter */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 pl-0.5">Train Type</h4>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Rajdhani Express', value: 'RAJDHANI' },
                { label: 'Superfast Trains', value: 'SUPERFAST' },
                { label: 'Express Trains', value: 'EXPRESS' }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setTypeFilter(typeFilter === item.value ? 'ALL' : item.value)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer text-left w-full
                    ${typeFilter === item.value
                      ? 'border-secondary-500 bg-secondary-50/40 text-secondary-700'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-500'
                    }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max Fare Filter */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Max Fare</h4>
              <span className="text-xs font-black text-secondary-700">₹{maxFare}</span>
            </div>
            <input
              type="range"
              min="400"
              max="3000"
              step="50"
              value={maxFare}
              onChange={(e) => setMaxFare(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-secondary-600 focus:outline-none"
            />
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-1 px-0.5">
              <span>Min: ₹400</span>
              <span>Max: ₹3000</span>
            </div>
          </div>

          {/* Seat Availability Only Toggle */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <span className="text-xs font-black text-slate-600">Available Seats Only</span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterAvailableOnly}
                onChange={() => setFilterAvailableOnly(!filterAvailableOnly)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600"></div>
            </label>
          </div>
        </aside>

        {/* Right Side: Schedules list */}
        <div className="lg:col-span-9 flex flex-col gap-4">

          {/* Skeleton Loaders with enriched structure */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <div className="h-6 bg-slate-200 rounded-md w-48 animate-pulse mb-1" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-150 rounded-3xl p-6 shadow-premium space-y-6 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-40" />
                      <div className="h-3.5 bg-slate-100 rounded w-28" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
                    <div className="md:col-span-3 space-y-2">
                      <div className="h-6 bg-slate-200 rounded w-20" />
                      <div className="h-4 bg-slate-100 rounded w-32" />
                    </div>
                    <div className="md:col-span-6 flex flex-col items-center gap-2">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                      <div className="h-2 bg-slate-150 rounded w-full" />
                      <div className="h-3.5 bg-slate-100 rounded w-24" />
                    </div>
                    <div className="md:col-span-3 space-y-2 flex flex-col items-end">
                      <div className="h-6 bg-slate-200 rounded w-20" />
                      <div className="h-4 bg-slate-100 rounded w-32" />
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-2">
                      <div className="h-10 bg-slate-100 rounded-xl w-24" />
                      <div className="h-10 bg-slate-100 rounded-xl w-24" />
                    </div>
                    <div className="h-11 bg-slate-200 rounded-xl w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error Retry Frame */
            <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center flex flex-col items-center gap-4 animate-slide-in">
              <p className="text-sm font-bold text-red-700">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Retry Train Search</span>
              </button>
            </div>
          ) : searchResults ? (
            /* Search Results View */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {processedTrains.length} train{(processedTrains.length !== 1) ? 's' : ''} resolved on {formatDate(searchResults.date)}
                </p>
              </div>

              {processedTrains.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {processedTrains.map((train) => (
                    <TrainCard key={train.trainId} train={train} />
                  ))}
                </div>
              ) : (
                /* Empty Filter state */
                <div className="bg-white border border-slate-150 rounded-3xl p-16 text-center shadow-premium flex flex-col items-center">
                  <SlidersHorizontal className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-black text-slate-800 mb-1">No matching trains found</h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-sm">Try resetting your active filters or expanding your maximum fare search range.</p>
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-3 bg-secondary-600 hover:bg-secondary-700 text-white font-bold rounded-xl shadow-md text-xs transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Initial search prompt frame */
            <div className="bg-white border border-slate-150 rounded-3xl p-16 text-center shadow-premium flex flex-col items-center">
              <Train className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-800 mb-1">Ready to search</h3>
              <p className="text-xs text-slate-400">Provide boarding & destination stations above to lookup available routes.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
