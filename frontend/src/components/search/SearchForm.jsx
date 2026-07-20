import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../../stores/search.store';
import { toast } from '../../stores/toast.store';
import StationAutocomplete from './StationAutocomplete';
import { ArrowLeftRight, Calendar, Search } from 'lucide-react';

export default function SearchForm() {
  const { query, setQuery, swapStations, executeSearch, isLoading } = useSearchStore();
  const navigate = useNavigate();

  const handleSearchSubmit = async (e) => {
    e.preventDefault();

    if (!query.from?.code || !query.to?.code) {
      toast.error('Please select both Origin and Destination stations');
      return;
    }

    if (query.from.code === query.to.code) {
      toast.error('Origin and Destination stations cannot be the same');
      return;
    }

    try {
      await executeSearch();
      navigate('/search');
    } catch (err) {
      toast.error(err.message || 'Search execution failed');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSearchSubmit} className="w-full font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 w-full">

        {/* From Station */}
        <div className="flex-1 min-w-[200px]">
          <StationAutocomplete
            label="From"
            value={query.from}
            onChange={(code, name) => setQuery({ from: code ? { code, name } : null })}
            placeholder="Search Origin Station"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center lg:pb-2.5">
          <button
            type="button"
            onClick={swapStations}
            className="p-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-secondary-650 hover:text-secondary-700 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            title="Swap Stations"
          >
            <ArrowLeftRight className="h-4 w-4 rotate-90 lg:rotate-0" />
          </button>
        </div>

        {/* To Station */}
        <div className="flex-1 min-w-[200px]">
          <StationAutocomplete
            label="To"
            value={query.to}
            onChange={(code, name) => setQuery({ to: code ? { code, name } : null })}
            placeholder="Search Destination Station"
          />
        </div>

        {/* Travel Date */}
        <div className="min-w-[160px]">
          <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5 pl-0.5">
            Departure Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-[13px] h-4.5 w-4.5 text-slate-400" />
            <input
              type="date"
              value={query.date}
              min={today}
              onChange={(e) => setQuery({ date: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 bg-white focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none transition-all text-sm shadow-sm cursor-pointer"
            />
          </div>
        </div>

        {/* Submit Search CTA */}
        <div className="lg:min-w-[140px]">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-accent-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>Search Trains</span>
          </button>
        </div>

      </div>
    </form>
  );
}
