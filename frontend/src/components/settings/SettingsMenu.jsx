import { classNames } from '../../utils/formatters';

export default function SettingsMenu({ items, activeKey, onSelect }) {
  return (
    <nav className="divide-y divide-[#edf2f7]">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={classNames(
            'flex w-full items-center gap-3 px-4 py-4 text-left transition',
            activeKey === item.key ? 'bg-[#ecfdf5] text-[#0f6e56]' : 'text-[#344054] hover:bg-[#f8fafc]'
          )}
        >
          <span className={classNames('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', activeKey === item.key ? 'bg-white text-[#1d9e75]' : 'bg-[#f5f7fb] text-[#64748b]')}>
            <item.icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{item.title}</span>
            <span className="mt-0.5 block truncate text-xs leading-5 text-[#64748b]">{item.subtitle}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
