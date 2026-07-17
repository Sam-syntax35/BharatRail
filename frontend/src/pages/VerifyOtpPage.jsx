import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { toast } from '../stores/toast.store';
import Input from '../components/common/Input';
import { MailCheck, ArrowLeft } from 'lucide-react';

export default function VerifyOtpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { otp: '' }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.verifyOtp(data.otp);
      toast.success('Email verified successfully! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'OTP verification failed');
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[75vh] py-8 px-4 font-sans">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
        
        {/* Verification Icon */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg mb-4">
            <MailCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Verify Account</h1>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Enter the 6-digit confirmation code sent to <strong className="text-slate-200">{email || 'your email'}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/30 border border-rose-900/50 text-rose-350 text-xs rounded-2xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Confirmation OTP Code"
            name="otp"
            placeholder="000000"
            maxLength={6}
            error={errors.otp}
            register={register}
            validation={{
              required: 'Verification code is required',
              pattern: { value: /^[0-9]{6}$/, message: 'Must be a 6-digit number' }
            }}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-lg hover:shadow-primary-500/20 text-sm flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify OTP</span>
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}
