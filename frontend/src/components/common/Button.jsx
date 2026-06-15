import { Loader2 } from 'lucide-react';
import { classNames } from '../../utils/formatters';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border-brand-600 shadow-[0_10px_24px_rgba(29,158,117,0.22)]',
  secondary: 'bg-white text-[#344054] hover:bg-[#f5f7fb] border-[#dbe3ea]',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
  ghost: 'bg-transparent text-[#344054] hover:bg-[#f5f7fb] border-transparent'
};

export default function Button({
  children,
  icon: Icon,
  variant = 'primary',
  loading = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={classNames(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </button>
  );
}
