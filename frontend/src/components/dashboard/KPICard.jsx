export default function KPICard({ title, value, icon: Icon, tone = 'text-brand-600', subtitle }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-gray-950">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
            <Icon className={`h-5 w-5 ${tone}`} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
