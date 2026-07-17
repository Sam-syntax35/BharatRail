import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { toast } from '../stores/toast.store';
import Input from '../components/common/Input';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { Train, Shield, HelpCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading, error: storeError, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  });

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    clearError();
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setShowForgotModal(false);
    toast.success('Password reset email sent (Simulation)');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row items-center justify-center min-h-[75vh] py-8 gap-8 md:gap-16 font-sans">
      
      {/* Visual / Brand Panel */}
      <div className="flex-1 max-w-lg hidden md:flex flex-col text-slate-100">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg mb-8">
          <Train className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Secure & Fast Train Bookings Across India
        </h2>
        <p className="text-slate-400 mb-8 leading-relaxed text-sm lg:text-base">
          Sign in to your BharatRail account to manage bookings, track refund updates, and experience the next generation of ticketing.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-900 bg-slate-950/40">
            <Shield className="w-5 h-5 text-accent-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-1">Encrypted Sessions</h4>
              <p className="text-xs text-slate-500">Industry-standard authentication layer.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-900 bg-slate-950/40">
            <HelpCircle className="w-5 h-5 text-accent-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-1">24/7 Support Desk</h4>
              <p className="text-xs text-slate-500">Get direct help with reservation issues.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Card Panel */}
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Sign In</h1>
          <p className="text-sm text-slate-400">Access your digital reservation panel</p>
        </div>

        {storeError && (
          <div className="bg-rose-950/30 border border-rose-900/50 text-rose-350 text-xs rounded-2xl px-4 py-3 mb-6 animate-pulse">
            {storeError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="name@example.com"
            error={errors.email}
            register={register}
            validation={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            }}
          />

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.password}
              register={register}
              validation={{ required: 'Password is required' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9 text-slate-550 hover:text-slate-400 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-end pr-1">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs font-semibold text-primary-400 hover:text-primary-350 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-lg hover:shadow-primary-500/20 text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Or</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Google Authentication */}
        <GoogleSignInButton onSuccess={() => navigate(from, { replace: true })} />

        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          New to BharatRail?{' '}
          <Link to="/register" className="font-semibold text-primary-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      {/* Forgot Password Simulation Dialog Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-6">
              Enter your email address and we will simulate sending a password reset code.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <Input
                label="Registered Email"
                placeholder="email@example.com"
                type="email"
                required
              />
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-800 hover:bg-slate-850 hover:text-white transition-all text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-all text-xs shadow-lg hover:shadow-primary-500/20"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
