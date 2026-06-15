import { classNames } from '../../utils/formatters';

export default function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={classNames(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'border-brand-600 bg-brand-600' : 'border-gray-300 bg-gray-200'
      )}
    >
      <span
        className={classNames(
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
