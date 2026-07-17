import { create } from 'zustand';
import { bookingApi } from '../api/booking.api';

export const useBookingStore = create((set, get) => ({
  selectedTrain: null,
  selectedSchedule: null,
  selectedSeats: [], // Array of seat objects { seatId, seatNumber, seatType, price }
  passengers: [], // Array of passenger details { name, age, gender }
  currentBooking: null, // Stores active order response
  isLoading: false,
  error: null,

  selectTrain: (train) => set({ selectedTrain: train }),
  selectSchedule: (schedule) => set({ selectedSchedule: schedule }),

  toggleSeatSelection: (seat) => {
    set((state) => {
      const isSelected = state.selectedSeats.some((s) => s.seatId === seat.seatId);
      let updatedSeats;
      if (isSelected) {
        updatedSeats = state.selectedSeats.filter((s) => s.seatId !== seat.seatId);
      } else {
        // Enforce max limit of 6 passengers/seats per ticket standard IRCTC limits
        if (state.selectedSeats.length >= 6) {
          return { error: 'You can select up to 6 seats only' };
        }
        updatedSeats = [...state.selectedSeats, seat];
      }
      return { selectedSeats: updatedSeats, error: null };
    });
  },

  setPassengers: (passengers) => set({ passengers }),

  addPassenger: (passenger) => {
    set((state) => {
      if (state.passengers.length >= 6) {
        return { error: 'Maximum 6 passengers allowed' };
      }
      return { passengers: [...state.passengers, passenger], error: null };
    });
  },

  removePassenger: (index) => {
    set((state) => ({
      passengers: state.passengers.filter((_, i) => i !== index),
    }));
  },

  createBooking: async (idempotencyKey, fromStationId, toStationId, fromSeq, toSeq) => {
    set({ isLoading: true, error: null });
    const { selectedSchedule, selectedSeats, passengers } = get();

    if (!selectedSchedule || selectedSeats.length === 0 || passengers.length === 0) {
      set({ error: 'Schedule, seats, and passengers are required to book' });
      set({ isLoading: false });
      return;
    }

    try {
      const seatIds = selectedSeats.map((s) => s.seatId);
      const payload = {
        scheduleId: selectedSchedule.scheduleId,
        seatIds,
        passengers,
        idempotencyKey,
      };

      if (fromStationId && toStationId) {
        payload.fromStationId = fromStationId;
        payload.toStationId = toStationId;
        payload.fromSeq = parseInt(fromSeq, 10);
        payload.toSeq = parseInt(toSeq, 10);
      }

      const res = await bookingApi.create(payload);
      if (res.success && res.data) {
        set({ currentBooking: res.data });
        return res.data;
      }
      throw new Error(res.message || 'Booking checkout failed');
    } catch (err) {
      set({ error: err.message || 'Failed to place booking hold' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearBookingState: () => {
    set({
      selectedTrain: null,
      selectedSchedule: null,
      selectedSeats: [],
      passengers: [],
      currentBooking: null,
      error: null,
      isLoading: false,
    });
  },
}));
