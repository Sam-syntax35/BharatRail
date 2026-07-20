import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../stores/booking.store';
import { useAuthStore } from '../stores/auth.store';
import { bookingApi } from '../api/booking.api';
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay';
import { toast } from '../stores/toast.store';
import { formatCurrency, formatSeatType } from '../utils/format';
import { Train, CreditCard, ShieldCheck } from 'lucide-react';

export default function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedTrain, selectedSchedule, selectedSeats, clearBookingState } = useBookingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      passengers: selectedSeats.map((s, idx) => ({
        name: '',
        age: '',
        gender: 'MALE',
        seatIndex: idx // link to corresponding seat
      }))
    }
  });

  const { fields } = useFieldArray({
    control,
    name: 'passengers'
  });

  // Redirect to home if selection was cleared or direct access
  useEffect(() => {
    if (!selectedTrain || selectedSeats.length === 0) {
      toast.error('Select train schedules and seats first.');
      navigate('/');
    }
  }, [selectedTrain, selectedSeats, navigate]);

  const totalCost = selectedSeats.reduce((acc, curr) => acc + (curr.price || 0), 0);

  const onConfirmBookingAndPay = async (formData) => {
    setIsSubmitting(true);
    try {
      const passengers = formData.passengers.map(p => ({
        name: p.name,
        age: parseInt(p.age, 10),
        gender: p.gender
      }));

      const seatIds = selectedSeats.map(s => s.seatId);
      const idempotencyKey = crypto.randomUUID();

      // Create booking payload with segment sequences
      const createPayload = {
        scheduleId: selectedSchedule.scheduleId,
        seatIds,
        passengers,
        idempotencyKey,
        fromStationId: selectedTrain.from?.stationId,
        toStationId: selectedTrain.to?.stationId,
        fromSeq: selectedTrain.from?.sequenceNumber,
        toSeq: selectedTrain.to?.sequenceNumber
      };

      const res = await bookingApi.create(createPayload);
      const bookingData = res.data || res;
      const paymentOrder = bookingData.paymentOrder;

      if (!paymentOrder?.gatewayOrderId) {
        toast.success('Hold placed successfully. Completing ticket booking...');
        navigate(`/bookings/${bookingData.bookingId}`);
        clearBookingState();
        return;
      }

      // Load Razorpay SDK
      await loadRazorpayScript();

      openRazorpayCheckout({
        keyId: paymentOrder.keyId,
        orderId: paymentOrder.gatewayOrderId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || 'INR',
        bookingDescription: `Train booking ${bookingData.bookingId}`,
        user,
        onSuccess: async (rzpRes) => {
          try {
            await bookingApi.verifyPayment(bookingData.bookingId, {
              razorpayPaymentId: rzpRes.razorpay_payment_id,
              razorpaySignature: rzpRes.razorpay_signature
            });
            toast.success('Payment verified! Confirming seats.');
          } catch (err) {
            console.error('Failed to verify payment client-side:', err);
            toast.success('Payment submitted. Updating booking status...');
          }
          clearBookingState();
          navigate(`/bookings/${bookingData.bookingId}`);
        },
        onDismiss: () => {
          toast.warning('Payment modal closed. Checking ticket status.');
          clearBookingState();
          navigate(`/bookings/${bookingData.bookingId}`);
        },
        onFailure: (rzpErr) => {
          toast.error('Payment issue: ' + (rzpErr?.error?.description || 'Failed transaction'));
          clearBookingState();
          navigate(`/bookings/${bookingData.bookingId}`);
        }
      });

    } catch (err) {
      toast.error(err.message || 'Failed to initialize booking transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans bg-slate-50">
      
      {/* Stepper Header Progress */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium flex justify-between items-center text-xs font-bold text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-650">
          <span>Search Route</span>
        </div>
        <div className="h-px bg-slate-200 flex-1 mx-4" />
        <div className="flex items-center gap-1.5 text-slate-650">
          <span>Select Seats</span>
        </div>
        <div className="h-px bg-slate-200 flex-1 mx-4" />
        <div className="flex items-center gap-1.5 text-secondary-650">
          <span className="bg-secondary-50 text-secondary-650 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
          <span>Passenger Details</span>
        </div>
        <div className="h-px bg-slate-200 flex-1 mx-4" />
        <div className="flex items-center gap-1.5">
          <span>Confirmation</span>
        </div>
      </div>

      {/* Grid Panels */}
      <form onSubmit={handleSubmit(onConfirmBookingAndPay)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Passenger Forms (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {fields.map((field, index) => {
            const correspondingSeat = selectedSeats[index];
            const pErrors = errors.passengers?.[index];

            return (
              <div
                key={field.id}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium animate-slide-in"
              >
                <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-secondary-50 text-secondary-600 flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </div>
                    <h3 className="font-extrabold text-sm text-primary-950 uppercase tracking-wide">
                      Passenger Info
                    </h3>
                  </div>
                  {correspondingSeat && (
                    <span className="text-xs font-bold text-slate-400">
                      Berth: Seat #{correspondingSeat.seatNumber} ({formatSeatType(correspondingSeat.seatType)})
                    </span>
                  )}
                </div>

                {/* Form fields layout */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Name field */}
                  <div className="sm:col-span-6 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 pl-0.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter passenger name"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 bg-white placeholder-slate-400 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none transition-all
                        ${pErrors?.name ? 'border-red-500 focus:border-red-650' : 'border-slate-200'}`}
                      {...register(`passengers.${index}.name`, { required: 'Name is required' })}
                    />
                    {pErrors?.name && (
                      <span className="text-xs text-red-500 font-semibold">{pErrors.name.message}</span>
                    )}
                  </div>

                  {/* Age field */}
                  <div className="sm:col-span-3 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 pl-0.5">
                      Age
                    </label>
                    <input
                      type="number"
                      placeholder="Age"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 bg-white placeholder-slate-400 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none transition-all
                        ${pErrors?.age ? 'border-red-500 focus:border-red-650' : 'border-slate-200'}`}
                      {...register(`passengers.${index}.age`, {
                        required: 'Age is required',
                        min: { value: 1, message: 'Invalid age' }
                      })}
                    />
                    {pErrors?.age && (
                      <span className="text-xs text-red-500 font-semibold">{pErrors.age.message}</span>
                    )}
                  </div>

                  {/* Gender dropdown */}
                  <div className="sm:col-span-3 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 pl-0.5">
                      Gender
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none transition-all cursor-pointer"
                      {...register(`passengers.${index}.gender`)}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Right Side: sticky trip & payment breakdown (5 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-5 sticky top-20">
          
          {/* Journey detail box */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium">
            <h3 className="font-extrabold text-sm text-primary-950 mb-4 uppercase tracking-wide">
              Itinerary Summary
            </h3>
            
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-4">
              <div className="p-2 bg-white rounded-xl text-secondary-600 shadow-sm">
                <Train className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">{selectedTrain?.trainName}</h4>
                <p className="text-xs text-slate-400 font-semibold uppercase">Train #{selectedTrain?.trainNumber}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Boarding Station</span>
                <span className="text-slate-800">{selectedTrain?.from?.name} ({selectedTrain?.from?.code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination Station</span>
                <span className="text-slate-800">{selectedTrain?.to?.name} ({selectedTrain?.to?.code})</span>
              </div>
              <div className="flex justify-between border-t border-slate-50 pt-3">
                <span className="text-slate-400">Departure</span>
                <span className="text-slate-800">{selectedTrain?.from?.departure || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Arrival</span>
                <span className="text-slate-800">{selectedTrain?.to?.arrival || '—'}</span>
              </div>
            </div>
          </div>

          {/* Secure Payment details card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium">
            <h3 className="font-extrabold text-sm text-primary-950 mb-4 uppercase tracking-wide">
              Booking Fees
            </h3>
            
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Fare Summary ({selectedSeats.length} seats)</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Convenience Charge</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-800 border-t border-slate-100 pt-3 mt-1">
                <span>Payable Amount</span>
                <span className="text-base text-secondary-650">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            {/* Secure Checkout Pay Now CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-accent-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Securing seats...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4.5 h-4.5" />
                  <span>Secure Pay {formatCurrency(totalCost)}</span>
                </>
              )}
            </button>
          </div>

          {/* Security details block */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs text-primary-950 uppercase tracking-wide mb-1">
                Payment security
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Reservations are routed securely using Razorpay gateway. Fares automatically qualify for easy refund updates if cancelled.
              </p>
            </div>
          </div>
        </aside>

      </form>
    </div>
  );
}
