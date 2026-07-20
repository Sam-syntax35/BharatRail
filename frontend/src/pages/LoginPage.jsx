import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { toast } from '../stores/toast.store';
import Input from '../components/common/Input';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { Train, ShieldCheck, Clock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading, error: storeError, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
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
      toast.success('Sign-in successful!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setShowForgotModal(false);
    toast.success('Simulation: Password reset email has been sent');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row items-center justify-center min-h-[75vh] py-8 gap-8 md:gap-16 font-sans bg-slate-50">
      
      {/* Visual / Brand Panel */}
      <div className="flex-1 max-w-lg hidden md:flex flex-col text-slate-800">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-premium mb-8">
          <Train className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight text-primary-950">
          Simplify Your Railway Journeys
        </h2>
        <p className="text-slate-550 mb-8 leading-relaxed text-sm lg:text-base">
          Log in to BharatRail to easily secure tickets, manage your itineraries, and access immediate refund status updates.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-premium">
            <ShieldCheck className="w-5 h-5 text-secondary-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-primary-900 uppercase tracking-wider mb-1">Encrypted Gateway</h4>
              <p className="text-xs text-slate-550">Protected checkout & payments.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-premium">
            <Clock className="w-5 h-5 text-secondary-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-primary-900 uppercase tracking-wider mb-1">Instant Holds</h4>
              <p className="text-xs text-slate-550">Hold seats for 10 minutes while paying.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Card Panel */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-premium-lg">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary-950 mb-2">Sign In</h1>
          <p className="text-sm text-slate-500">Welcome back! Please enter your details</p>
        </div>

        {storeError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl px-4 py-3 mb-6">
            {storeError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="john.doe@example.com"
            error={errors.email}
            register={register}
            validation={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please provide a valid email address'
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
              className="absolute right-4 top-10 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded border-slate-300 text-secondary-600 focus:ring-secondary-500"
              />
              <span>Remember me</span>
            </label>
            
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs font-bold text-secondary-600 hover:text-secondary-700 hover:underline transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-secondary-600 hover:bg-secondary-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-secondary-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Checking credentials...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs text-slate-400 font-bold uppercase">Or</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Google Authentication Button */}
        <GoogleSignInButton onSuccess={() => navigate(from, { replace: true })} />

        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-secondary-600 hover:underline">
            Register now
          </Link>
        </p>
      </div>

      {/* Forgot Password Simulation Dialog Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-premium-lg relative animate-slide-in">
            <h3 className="text-lg font-bold text-primary-950 mb-2">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter your email address to receive password reset instructions.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <Input
                label="Account Email"
                placeholder="john.doe@example.com"
                type="email"
                required
              />
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all text-xs font-semibold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-white font-bold transition-all text-xs shadow-md cursor-pointer"
                >
                  Send Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
