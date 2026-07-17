const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Pending Payment', value: 'PAYMENT_PENDING' },
  { label: 'Seats Held', value: 'SEATS_HELD' },
  { label: 'Processing', value: 'PENDING' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Expired', value: 'EXPIRED' },
];

export default function BookingFilters({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === f.value ? 'bg-primary-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}