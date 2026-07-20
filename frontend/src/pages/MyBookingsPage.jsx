/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api/booking.api';
import { toast } from '../stores/toast.store';
import { formatDate, formatCurrency, formatPNR } from '../utils/format';
import { Ticket, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async (status, page) => {
    try {
      const res = await bookingApi.list(status || undefined, page, 6);
      const data = res.data || res;
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to retrieve bookings history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings('', 1);
  }, []);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setLoading(true);
    fetchBookings(status, 1);
  };

  const handlePageChange = (page) => {
    setLoading(true);
    fetchBookings(statusFilter, page);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full font-sans">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary-950">My Reservation Bookings</h1>
        <p className="text-sm text-slate-500">Access, print, or cancel your ticket reservations</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-100 rounded-3xl p-3 shadow-premium flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'All Journeys', value: '' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Pending Holds', value: 'PENDING' },
            { label: 'Cancelled', value: 'CANCELLED' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                ${
                  statusFilter === tab.value
                    ? 'bg-secondary-600 text-white shadow-md shadow-secondary-500/20'
                    : 'text-slate-650 hover:bg-slate-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List Layout */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
          <div className="w-8 h-8 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-bold tracking-wide animate-pulse">Loading bookings list...</p>
        </div>
      ) : bookings.length === 0 ? (
        /* Empty booking list state */
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-premium">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No bookings resolved</h3>
          <p className="text-xs text-slate-500 mb-6">
            {statusFilter ? 'No trips match this filter status.' : 'You have not booked any tickets yet.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-secondary-600 hover:bg-secondary-700 text-white font-bold rounded-xl shadow-md text-xs transition-colors"
          >
            <span>Book Ticket Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Card list */}
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-premium-lg transition-all"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-extrabold text-slate-800 text-base">{b.trainName}</span>
                    <span className="text-xs font-bold text-slate-400 font-mono">#{b.trainNumber}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold">
                    <span>PNR: <strong className="text-slate-700 font-bold">{formatPNR(b.id)}</strong></span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(b.journeyDate || b.departureDate)}
                    </span>
                    <span>•</span>
                    <span>{b.passengers?.length || b.seatCount || 1} Berth{(b.passengers?.length || b.seatCount) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-50 pt-3.5 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Paid Amount</p>
                    <span className="text-sm font-black text-slate-850 mt-0.5 block">{formatCurrency(b.totalAmount)}</span>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</p>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5
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
                    className="px-4 py-2.5 text-xs font-bold border border-slate-200 hover:border-secondary-500 text-slate-650 hover:text-secondary-750 rounded-xl transition-all shadow-sm bg-white cursor-pointer"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-bold text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
