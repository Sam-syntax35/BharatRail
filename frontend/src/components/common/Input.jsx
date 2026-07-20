
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
        <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl border text-slate-800 bg-white placeholder-slate-400 transition-all outline-none text-sm md:text-base
          ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}
          ${
            error
              ? 'border-red-500/80 focus:border-red-600 focus:ring-1 focus:ring-red-600'
              : 'border-slate-200 hover:border-slate-300 focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 shadow-sm'
          }`}
        {...register(name, validation)}
        {...rest}
      />
      {error && (
        <span className="text-xs font-semibold text-red-500 mt-0.5 pl-1">
          {error.message}
        </span>
      )}
    </div>
  );
}
