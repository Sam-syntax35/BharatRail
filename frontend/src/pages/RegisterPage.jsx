import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { toast } from '../stores/toast.store';
import Input from '../components/common/Input';
import { Train, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.sendOtp({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      toast.success('Verification OTP code sent to your email!');
      // Forward the user to verify OTP and pass the email address
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP verification email');
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[75vh] py-8 px-4 font-sans">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
        
        {/* Brand / Logo */}
        <div className="flex flex-col items-center mb-6 md:mb-8 text-center">
          <Link to="/" className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-md mb-4 hover:scale-105 transition-transform">
            <Train className="h-5 w-5 text-white" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Create Account</h1>
          <p className="text-sm text-slate-400">Join BharatRail to reserve tickets instantly</p>
        </div>

        {error && (
          <div className="bg-rose-950/30 border border-rose-900/50 text-rose-350 text-xs rounded-2xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              name="firstName"
              placeholder="John"
              error={errors.firstName}
              register={register}
              validation={{ required: 'First name is required' }}
            />
            <Input
              label="Last Name"
              name="lastName"
              placeholder="Doe"
              error={errors.lastName}
              register={register}
              validation={{ required: 'Last name is required' }}
            />
          </div>

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
              validation={{
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9 text-slate-550 hover:text-slate-400 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.confirmPassword}
              register={register}
              validation={{
                required: 'Confirm your password',
                validate: (value) => value === passwordVal || 'Passwords do not match'
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-9 text-slate-550 hover:text-slate-400 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-lg hover:shadow-primary-500/20 text-sm flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending OTP...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
