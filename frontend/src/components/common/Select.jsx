import { classNames } from '../../utils/formatters';

export default function Select({ label, error, options = [], className = '', children, ...props }) {
  return (
    <label className={classNames('block text-sm', className)}>
      {label ? <span className="mb-1 block font-semibold text-[#344054]">{label}</span> : null}
      <select
        className={classNames(
          'h-11 w-full rounded-lg border bg-white px-3 text-sm text-[#172033] shadow-sm transition',
          error ? 'border-red-400' : 'border-[#dbe3ea]',
          'focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
        )}
        {...props}
      >
        {children ||
          options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
      </select>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
