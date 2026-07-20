import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBookingPolling } from '../hooks/useBookingPolling';
import { bookingApi } from '../api/booking.api';
import { toast } from '../stores/toast.store';
import { formatDate, formatDateTime, formatCurrency, formatSeatType } from '../utils/format';
import { Train, Printer, ChevronRight, XCircle, HelpCircle } from 'lucide-react';

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const { booking, loading, error, refresh } = useBookingPolling(bookingId);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelTicket = async () => {
    setIsCancelling(true);
    try {
      await bookingApi.cancel(bookingId);
      toast.success('Ticket reservation cancelled successfully.');
      setShowCancelModal(false);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Cancellation request failed');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="w-10 h-10 border-3 border-secondary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-wide animate-pulse">Retrieving reservation details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto w-full py-8 font-sans">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-6 text-center shadow-sm">
          <p className="font-extrabold text-sm uppercase mb-1">Retrieval Error</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const canCancel = ['CONFIRMED', 'PAYMENT_PENDING', 'SEATS_HELD'].includes(booking.status);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full font-sans print:p-0 print:border-0">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link to="/bookings" className="text-xs font-bold text-slate-400 hover:text-slate-650 transition-colors uppercase">
              My Bookings
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-350" />
            <span className="text-xs font-bold text-slate-400 uppercase">Reservation Details</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary-950">Ticket Reservation Details</h1>
        </div>
        
        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print E-Ticket</span>
          </button>
          
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Cancel Booking</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Alerts banner */}
      {booking.status === 'CONFIRMED' && (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-5 flex items-start gap-4 animate-slide-in">
          <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0">
            ✓
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-green-800">Booking Confirmed!</h4>
            <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
              Your berths have been successfully reserved. A copy of the PNR confirmation status has been saved.
            </p>
          </div>
        </div>
      )}

      {booking.status === 'CANCELLED' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4 animate-slide-in">
          <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0">
            !
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-amber-800">Reservation Cancelled</h4>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              This ticket reservation was cancelled. The associated berths have been released back to the inventory server.
            </p>
          </div>
        </div>
      )}

      {/* Main details frame */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Timeline & Fares (7 cols) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Train details card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-50 rounded-xl text-secondary-650">
                <Train className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-primary-950">{booking.trainName}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                  Train #{booking.trainNumber} • {formatDate(booking.departureDate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-650 mt-6 pt-5 border-t border-slate-50">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">PNR</p>
                <span className="text-sm font-black text-slate-800 font-mono">{booking.pnr || '—'}</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Booking Status</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-0.5
                  ${
                    booking.status === 'CONFIRMED'
                      ? 'bg-green-50 text-green-700'
                      : booking.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {booking.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Booked On</p>
                <span className="text-slate-800 font-medium">{formatDateTime(booking.createdAt)}</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Paid</p>
                <span className="text-sm font-black text-secondary-650">{formatCurrency(booking.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Passengers Table card */}
          {booking.passengers && booking.passengers.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <h3 className="font-extrabold text-sm text-primary-950 mb-4 uppercase tracking-wide">
                Passengers
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-semibold text-slate-650">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 text-left font-bold pl-1">#</th>
                      <th className="py-2.5 text-left font-bold">Name</th>
                      <th className="py-2.5 text-left font-bold">Age</th>
                      <th className="py-2.5 text-left font-bold">Gender</th>
                      <th className="py-2.5 text-right font-bold pr-1">Berth Assign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.passengers.map((p, idx) => {
                      const seatObj = booking.seats?.[idx];
                      return (
                        <tr key={p.id || idx} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 pl-1 font-bold">{idx + 1}</td>
                          <td className="py-3 font-bold text-slate-800">{p.name}</td>
                          <td className="py-3">{p.age} Yrs</td>
                          <td className="py-3 capitalize text-[10px] font-bold text-slate-450">{p.gender?.toLowerCase()}</td>
                          <td className="py-3 text-right pr-1 font-mono">
                            {seatObj ? (
                              <span className="text-xs font-bold text-secondary-650">
                                Seat #{seatObj.seatNumber} ({formatSeatType(seatObj.seatType)})
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Awaiting Assign</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Timeline & Refunds (4 cols) */}
        <aside className="md:col-span-4 flex flex-col gap-6 sticky top-20">
          
          {/* Refund Details box if cancelled */}
          {(booking.status === 'CANCELLED' || (booking.status === 'FAILED' && booking.failureReason?.includes('confirm_failed'))) && booking.paymentOrderId && (
            <div className="bg-amber-50/40 border border-amber-250 rounded-3xl p-5 shadow-premium">
              <h3 className="font-extrabold text-sm text-amber-900 mb-3 uppercase tracking-wide">
                Refund Tracker
              </h3>
              
              <div className="flex flex-col gap-3 text-xs font-semibold text-amber-800">
                <div className="flex justify-between">
                  <span className="text-amber-600">Refund Status</span>
                  <span className="font-bold text-green-700">Initiated (Auto)</span>
                </div>
                <div className="flex justify-between border-t border-amber-100/50 pt-2.5">
                  <span className="text-amber-600">Amount</span>
                  <span className="font-black text-sm">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>
              <p className="text-[10px] text-amber-600 leading-relaxed mt-4 pt-3 border-t border-amber-100/50">
                Automatic refunds are processed back to the original source bank accounts within 3-5 business days.
              </p>
            </div>
          )}

          {/* Secure reservation note card */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs text-primary-950 uppercase tracking-wide mb-1">
                Help & Enquiries
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                For seat adjustment requests or timeline updates, contact the help desk quoting PNR {booking.pnr || booking.id}.
              </p>
            </div>
          </div>
        </aside>

      </div>

      {/* Cancel Ticket Modal Confirmation Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-premium-lg relative animate-slide-in">
            <h3 className="text-lg font-bold text-rose-950 mb-2">Cancel Ticket Reservation?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to cancel this booking? This action releases the berths back into availability.
              {booking.status === 'CONFIRMED' && ' An automatic refund will be triggered immediately.'}
            </p>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all text-xs font-semibold cursor-pointer"
              >
                No, Keep Ticket
              </button>
              <button
                onClick={handleCancelTicket}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all text-xs shadow-md cursor-pointer"
              >
                {isCancelling ? 'Processing...' : 'Yes, Cancel Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
