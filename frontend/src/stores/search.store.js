import { create } from 'zustand';
import { searchApi } from '../api/search.api';

const HISTORY_KEY = 'irctc_search_history';

const loadSearchHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSearchHistory = (history) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5))); // Keep last 5 queries
  } catch {
    // Ignore
  }
};

export const useSearchStore = create((set, get) => ({
  query: {
    from: null, // { name: string, code: string, stationId: string }
    to: null,   // { name: string, code: string, stationId: string }
    date: new Date().toISOString().split('T')[0],
  },
  searchResults: null,
  searchHistory: loadSearchHistory(),
  isLoading: false,
  error: null,

  setQuery: (newQuery) => {
    set((state) => ({ query: { ...state.query, ...newQuery } }));
  },

  swapStations: () => {
    set((state) => {
      const { from, to } = state.query;
      return { query: { ...state.query, from: to, to: from } };
    });
  },

  executeSearch: async () => {
    const { from, to, date } = get().query;
    if (!from || !to) {
      set({ error: 'Origin and Destination stations are required' });
      return;
    }

    set({ isLoading: true, error: null, searchResults: null });

    try {
      const res = await searchApi.search(from.code, to.code, date);
      if (res.success) {
        set({ searchResults: res.data });
        get().saveQueryToHistory({ from, to, date });
      } else {
        throw new Error(res.message || 'Search failed');
      }
    } catch (err) {
      if (err.message !== 'REQUEST_CANCELLED') {
        set({ error: err.message || 'Failed to search trains' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  saveQueryToHistory: (searchRecord) => {
    const history = get().searchHistory;
    const filtered = history.filter(
      (h) => !(h.from.code === searchRecord.from.code && h.to.code === searchRecord.to.code)
    );
    const newHistory = [searchRecord, ...filtered].slice(0, 5);
    set({ searchHistory: newHistory });
    saveSearchHistory(newHistory);
  },

  clearHistory: () => {
    set({ searchHistory: [] });
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignore
    }
  },

  clearResults: () => set({ searchResults: null, error: null }),
}));
