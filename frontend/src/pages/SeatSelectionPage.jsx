import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookingStore } from '../stores/booking.store';
import { inventoryApi } from '../api/inventory.api';
import { toast } from '../stores/toast.store';
import { formatSeatType, formatCurrency } from '../utils/format';
import { Train, ArrowRight, ShieldCheck, Grid, Info } from 'lucide-react';

export default function SeatSelectionPage() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { selectedTrain, selectedSeats, toggleSeatSelection, selectTrain, selectSchedule } = useBookingStore();

  const [seats, setSeats] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | LOWER | MIDDLE | UPPER | SIDE_LOWER | SIDE_UPPER

  useEffect(() => {
    async function fetchSeatsAndAvailability() {
      setLoading(true);
      try {
        const seatParams = {};
        if (selectedTrain?.from?.sequenceNumber && selectedTrain?.to?.sequenceNumber) {
          seatParams.fromSeq = selectedTrain.from.sequenceNumber;
          seatParams.toSeq = selectedTrain.to.sequenceNumber;
        }

        const [availRes, seatsRes] = await Promise.all([
          inventoryApi.getAvailability(scheduleId),
          inventoryApi.getSeats(scheduleId, seatParams)
        ]);

        const rawAvail = availRes.data || availRes;
        const seatList = (seatsRes.data?.seats || seatsRes.seats || []).sort((a, b) => a.seatNumber - b.seatNumber);
        
        setSeats(seatList);

        // Segment booking recomputation check
        if (seatParams.fromSeq && seatParams.toSeq && seatList.some(s => s.segmentStatus)) {
          const segAvail = seatList.filter(s => s.segmentStatus === 'AVAILABLE').length;
          const segUnavail = seatList.filter(s => s.segmentStatus === 'UNAVAILABLE').length;
          setAvailability({
            ...rawAvail,
            available: segAvail,
            booked: segUnavail,
            locked: 0,
          });
        } else {
          setAvailability(rawAvail);
        }

        // Hydrate selected train details if page loaded directly
        if (!selectedTrain) {
          const fallbackTrain = {
            trainName: rawAvail.trainName,
            trainNumber: rawAvail.trainNumber,
            trainId: rawAvail.trainId,
          };
          selectTrain(fallbackTrain);
          selectSchedule(rawAvail);
        }
      } catch (err) {
        if (err.message !== 'REQUEST_CANCELLED') {
          toast.error(err.message || 'Failed to retrieve available inventory');
          navigate('/search');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSeatsAndAvailability();
  }, [scheduleId, selectedTrain, navigate, selectSchedule, selectTrain]);

  const handleSeatClick = (seat) => {
    const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);
    if (!isSelected && selectedSeats.length >= 6) {
      toast.error('Standard limits permit reserving up to 6 seats per transaction.');
      return;
    }
    toggleSeatSelection(seat);
  };

  const getEffectiveStatus = (seat) => {
    if (seat.segmentStatus) {
      return seat.segmentStatus === 'AVAILABLE' ? 'AVAILABLE' : 'BOOKED';
    }
    return seat.status;
  };

  const filteredSeats = filter === 'ALL' ? seats : seats.filter((s) => s.seatType === filter);

  const totalCost = selectedSeats.reduce((acc, curr) => acc + (curr.price || 0), 0);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="w-10 h-10 border-3 border-secondary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-wide animate-pulse">Loading seat configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans">
      
      {/* Page Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-extrabold text-slate-400 uppercase text-xs">Route Selection</span>
            <span className="text-slate-200">•</span>
            <span className="text-xs font-bold text-secondary-600 bg-secondary-50 px-2 py-0.5 rounded-md uppercase">
              Live Status
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-primary-950 flex items-center gap-2">
            <Train className="w-5 h-5 text-secondary-650" />
            {selectedTrain?.trainName}
            <span className="text-sm font-bold text-slate-400 font-mono">#{selectedTrain?.trainNumber}</span>
          </h2>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aggregate availability</p>
            <span className="text-sm font-black text-slate-800">{availability?.available || 0} seats open</span>
          </div>
        </div>
      </div>

      {/* Main Grid Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Seat Layout Grid (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-50 pb-5">
              <h3 className="font-extrabold text-sm text-primary-950 flex items-center gap-1.5 uppercase tracking-wide">
                <Grid className="w-4.5 h-4.5 text-slate-500" />
                Berth Selector
              </h3>

              {/* Legends */}
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded border border-green-300 bg-green-50" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded border border-secondary-500 bg-secondary-600" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" />
                  <span>Reserved</span>
                </div>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { label: 'All Berths', value: 'ALL' },
                { label: 'Lower Berth', value: 'LOWER' },
                { label: 'Middle Berth', value: 'MIDDLE' },
                { label: 'Upper Berth', value: 'UPPER' },
                { label: 'Side Lower', value: 'SIDE_LOWER' },
                { label: 'Side Upper', value: 'SIDE_UPPER' }
              ].map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setFilter(chip.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer
                    ${
                      filter === chip.value
                        ? 'border-secondary-550 bg-secondary-50 text-secondary-750'
                        : 'border-slate-150 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Main Interactive Grid */}
            {filteredSeats.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredSeats.map((seat) => {
                  const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);
                  const effectiveStatus = getEffectiveStatus(seat);
                  const canSelect = effectiveStatus === 'AVAILABLE';

                  return (
                    <button
                      key={seat.seatId}
                      onClick={() => handleSeatClick(seat)}
                      disabled={!canSelect && !isSelected}
                      className={`border rounded-2xl p-3 text-center transition-all flex flex-col items-center justify-between min-h-[90px] cursor-pointer group
                        ${
                          isSelected
                            ? 'bg-secondary-600 border-secondary-700 text-white shadow-md shadow-secondary-500/25'
                            : canSelect
                            ? 'bg-green-50/40 border-green-200 hover:border-green-300 text-slate-800'
                            : 'bg-slate-50 border-slate-150 text-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                    >
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">
                        {seat.seatType === 'SIDE_LOWER'
                          ? 'SL'
                          : seat.seatType === 'SIDE_UPPER'
                          ? 'SU'
                          : seat.seatType.substring(0, 3)}
                      </span>
                      <span className="text-base font-black my-1">
                        #{seat.seatNumber}
                      </span>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        {formatCurrency(seat.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-slate-150 rounded-2xl">
                <Info className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-450 uppercase">No berths match this filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: sticky selection details (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
          
          {/* Reservation Card Details */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium">
            <h3 className="font-extrabold text-sm text-primary-950 mb-4 uppercase tracking-wide">
              Selected Berths
            </h3>

            {selectedSeats.length > 0 ? (
              <div className="flex flex-col gap-3">
                {selectedSeats.map((seat) => (
                  <div
                    key={seat.seatId}
                    className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-850 text-sm">Seat #{seat.seatNumber}</span>
                      <span className="text-[10px] text-slate-450 font-bold uppercase">
                        {formatSeatType(seat.seatType)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-800">{formatCurrency(seat.price)}</span>
                      <button
                        onClick={() => toggleSeatSelection(seat)}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Billing details block */}
                <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Base Fare</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-450">
                    <span>IRCTC Booking Fee</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-slate-800 border-t border-slate-50 pt-3 mt-1">
                    <span>Total Amount</span>
                    <span className="text-base text-secondary-650">{formatCurrency(totalCost)}</span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <button
                  onClick={() => navigate('/booking/checkout')}
                  className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-secondary-500/20 text-sm flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  <span>Proceed to Passenger Info</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs font-semibold">Select berths from the grid layout to start reservation hold.</p>
              </div>
            )}
          </div>

          {/* Secure reservation note card */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs text-primary-950 uppercase tracking-wider mb-1">
                BharatRail Assured Hold
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Seats selected are temporarily locked inside the inventory server for 10 minutes to guarantee reservation holds during checkout.
              </p>
            </div>
          </div>
        </aside>

      </div>

    </div>
  );
}
