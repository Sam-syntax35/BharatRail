/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { searchApi } from '../../api/search.api';
import { MapPin, Loader2 } from 'lucide-react';

export default function StationAutocomplete({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef(null);
  const selectedCodeRef = useRef((value && typeof value === 'object') ? value.code || '' : value || '');

  // Sync external changes (e.g. if swapped)
  useEffect(() => {
    const valCode = (value && typeof value === 'object') ? value.code : value;
    const valName = (value && typeof value === 'object') ? value.name : null;

    if (valCode !== undefined && valCode !== selectedCodeRef.current) {
      selectedCodeRef.current = valCode || '';
      if (!valCode) {
        setQuery('');
      } else {
        setQuery(valName ? `${valName} (${valCode})` : valCode);
      }
    }
  }, [value]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    let active = true;
    setLoading(true);

    searchApi.autocomplete(debouncedQuery)
      .then((res) => {
        if (!active) return;
        const list = res.data?.data || res.data || [];
        setSuggestions(list);
        setOpen(true);
      })
      .catch(() => {
        if (active) setSuggestions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (station) => {
    const formattedName = `${station.name} (${station.code})`;
    selectedCodeRef.current = station.code;
    setQuery(formattedName);
    onChange(station.code, station.name);
    setOpen(false);
  };

  return (
    <div className="relative w-full font-sans" ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5 pl-0.5">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3.5 top-[13px] h-4.5 w-4.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length < 2) {
              selectedCodeRef.current = '';
              onChange('', '');
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-slate-800 bg-white placeholder-slate-400 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none transition-all text-sm shadow-sm"
        />
        {loading && (
          <div className="absolute right-3.5 top-[13px]">
            <Loader2 className="h-4.5 w-4.5 animate-spin text-secondary-500" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-premium-lg max-h-60 overflow-y-auto py-1 animate-slide-in">
          {suggestions.map((s) => (
            <li
              key={s.stationId || s.code}
              onClick={() => handleSelect(s)}
              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm flex items-center justify-between transition-colors border-b border-slate-50 last:border-b-0"
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                <span className="text-xs text-slate-400 font-semibold">{s.code} Station</span>
              </div>
              <span className="text-xs font-bold text-secondary-600 bg-secondary-50 px-2 py-0.5 rounded-md uppercase">
                {s.code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
