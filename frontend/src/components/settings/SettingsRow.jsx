import { classNames } from '../../utils/formatters';

export default function SettingsRow({ icon: Icon, title, description, control, children, className = '' }) {
  return (
    <div className={classNames('flex items-start gap-3 py-3', className)}>
      {Icon ? (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {description ? <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p> : null}
          </div>
          {control ? <div className="shrink-0">{control}</div> : null}
        </div>
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </div>
  );
}
