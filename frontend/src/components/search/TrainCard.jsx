import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../stores/booking.store';
import { useAuthStore } from '../../stores/auth.store';
import { formatSeatType, formatCurrency } from '../../utils/format';
import { Train, Clock, ArrowRight, ShieldCheck, MapPin, Calendar } from 'lucide-react';

export default function TrainCard({ train }) {
  const navigate = useNavigate();
  const selectTrain = useBookingStore((s) => s.selectTrain);
  const selectSchedule = useBookingStore((s) => s.selectSchedule);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const schedule = train.schedule;
  const seatSummary = train.seatSummary || {};
  
  // Separation of schedule states
  const isScheduled = !!schedule;
  const isCancelled = isScheduled && schedule.status === 'CANCELLED';
  const availableSeats = isScheduled ? (schedule.available || 0) : 0;

  const handleBookClick = () => {
    if (!isScheduled) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/booking/seats/${schedule.scheduleId}`)}`);
      return;
    }
    selectTrain(train);
    selectSchedule(schedule);
    navigate(`/booking/seats/${schedule.scheduleId}`);
  };

  const getEstimatedPrice = (type) => {
    switch (type) {
      case 'LOWER': return 550;
      case 'MIDDLE': return 520;
      case 'UPPER': return 500;
      case 'SIDE_LOWER': return 540;
      case 'SIDE_UPPER': return 480;
      default: return 450;
    }
  };

  // Helper to calculate dynamic duration
  const getDuration = (dep, arr) => {
    if (!dep || !arr) return '2h 15m';
    const [dh, dm] = dep.split(':').map(Number);
    const [ah, am] = arr.split(':').map(Number);
    let diffMins = (ah * 60 + am) - (dh * 60 + dm);
    if (diffMins < 0) diffMins += 24 * 60; // Next day
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  // Helper to calculate dynamic distance
  const getDistance = () => {
    const fromDist = train.from?.distanceFromOrigin || 0;
    const toDist = train.to?.distanceFromOrigin || 0;
    const dist = Math.abs(toDist - fromDist);
    return dist > 0 ? `${dist.toFixed(0)} km` : '420 km';
  };

  // Helper to identify train classification
  const getTrainType = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('rajdhani')) return 'Rajdhani Express';
    if (lower.includes('shatabdi')) return 'Shatabdi Express';
    if (lower.includes('duronto')) return 'Duronto Express';
    if (lower.includes('express')) return 'Express';
    return 'Superfast';
  };

  const depTime = train.from?.departure || '08:00';
  const arrTime = train.to?.arrival || '13:30';
  const durationStr = getDuration(depTime, arrTime);
  const distanceStr = getDistance();
  const trainType = getTrainType(train.trainName);

  // Check if arrival crosses over to the next day
  const [dh, dm] = depTime.split(':').map(Number);
  const [ah, am] = arrTime.split(':').map(Number);
  const isNextDay = (ah * 60 + am) <= (dh * 60 + dm);

  // Hardcode weekly schedule display helper
  const runningDays = [
    { label: 'M', active: true },
    { label: 'T', active: true },
    { label: 'W', active: true },
    { label: 'T', active: true },
    { label: 'F', active: true },
    { label: 'S', active: true },
    { label: 'S', active: true }
  ];

  return (
    <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-premium hover:shadow-premium-lg transition-all duration-300 font-sans relative group">
      
      {/* Top Details Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-700">
              <Train className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-primary-950 tracking-tight">{train.trainName}</h3>
            <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
              #{train.trainNumber}
            </span>
            <span className="text-xs font-bold text-secondary-700 bg-secondary-50 border border-secondary-100 px-2 py-0.5 rounded-lg">
              {trainType}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Runs: Daily
            </span>
            <span>•</span>
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-150">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span>BharatRail Assured</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Availability:</span>
          {!isScheduled ? (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              Not Scheduled
            </span>
          ) : isCancelled ? (
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
              Cancelled
            </span>
          ) : availableSeats > 0 ? (
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {availableSeats} Seats Left
            </span>
          ) : (
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              0 Seats Left
            </span>
          )}
        </div>
      </div>

      {/* Travel Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 mb-6">
        
        {/* Departure Station Details */}
        <div className="md:col-span-3 text-left">
          <p className="text-2xl font-black text-slate-800 tracking-tight">{depTime}</p>
          <h4 className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {train.from?.name}
          </h4>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5 pl-4.5">
            ({train.from?.code})
          </p>
        </div>

        {/* Timeline Vector Indicator & Empty Center filler */}
        <div className="md:col-span-6 flex flex-col items-center justify-center px-4">
          <span className="text-xs font-extrabold text-slate-500 mb-1">{durationStr}</span>
          <div className="flex items-center gap-2 w-full">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-secondary-500 bg-white" />
            <div className="h-px bg-slate-200 flex-1 border-dashed border-t" />
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap px-2 bg-slate-50 border border-slate-100 rounded-full py-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{distanceStr}</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 border-dashed border-t" />
            <ArrowRight className="w-4 h-4 text-secondary-500" />
          </div>
          
          {/* Running Days Highlights */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase mr-1">Runs:</span>
            {runningDays.map((d, index) => (
              <span 
                key={index} 
                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black
                  ${d.active ? 'bg-secondary-50 text-secondary-700 border border-secondary-100' : 'bg-slate-50 text-slate-300'}`}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Arrival Station Details */}
        <div className="md:col-span-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{arrTime}</p>
            {isNextDay && (
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase">
                +1 Day
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-800 mt-1 flex items-center justify-end gap-1">
            {train.to?.name}
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </h4>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5 pr-5">
            ({train.to?.code})
          </p>
        </div>

      </div>

      {/* Berth Fares Matrix + CTA Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6 pt-5 border-t border-slate-100">
        
        {/* Horizontal Seat Berth Cards */}
        <div className="flex flex-wrap gap-3 flex-1">
          {Object.entries(seatSummary)
            .filter(([k]) => k !== 'total')
            .map(([type, count]) => {
              // Calculate class-specific display state
              const classText = !isScheduled
                ? 'Unavailable'
                : availableSeats === 0
                ? '0 Available'
                : `${count} Available`;
              
              const isClassAvailable = isScheduled && availableSeats > 0;

              return (
                <div
                  key={type}
                  className="bg-slate-50 border border-slate-150 hover:border-secondary-200 hover:bg-secondary-50/10 rounded-2xl p-3 min-w-[115px] text-left transition-all cursor-pointer group/berth"
                >
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase group-hover/berth:text-secondary-600">
                    {formatSeatType(type)}
                  </p>
                  <p className="text-sm font-black text-slate-800 mt-1">
                    {formatCurrency(getEstimatedPrice(type))}
                  </p>
                  <span className={`text-[10px] font-bold block mt-0.5 ${isClassAvailable ? 'text-green-600' : 'text-slate-400'}`}>
                    {classText}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Action Button */}
        <div className="sm:min-w-[160px] flex justify-end">
          {!isScheduled ? (
            <button
              disabled
              className="w-full sm:w-auto bg-slate-50 text-slate-400 font-bold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center border border-slate-200 cursor-not-allowed"
            >
              No Runs Today
            </button>
          ) : isCancelled ? (
            <button
              disabled
              className="w-full sm:w-auto bg-rose-50 text-rose-500 font-bold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center border border-rose-100 cursor-not-allowed uppercase"
            >
              Cancelled
            </button>
          ) : availableSeats > 0 ? (
            <button
              onClick={handleBookClick}
              className="w-full sm:w-auto bg-accent-600 hover:bg-accent-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-accent-500/20 text-sm flex items-center justify-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Book Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled
              className="w-full sm:w-auto bg-slate-100 text-slate-400 font-bold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
            >
              <span>Sold Out</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}

