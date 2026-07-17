export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  register = () => ({}),
  validation = {},
  disabled = false,
  ...rest
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full font-sans">
      {label && (
        <label className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-2xl bg-slate-900/40 border text-slate-100 placeholder-slate-500 transition-all outline-none text-sm md:text-base
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${
            error
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-800 hover:border-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
          }`}
        {...register(name, validation)}
        {...rest}
      />
      {error && (
        <span className="text-xs font-medium text-rose-400 mt-0.5 pl-1 animate-pulse">
          {error.message}
        </span>
      )}
    </div>
  );
}
