import MiniSparkline from './MiniSparkline';

export default function SummaryCard({ title, value, description, icon: Icon, trend, tone = '#2563eb' }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#dbe3ea] bg-white p-4 shadow-card">
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: tone }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-[#172033]">{value}</p>
          {description ? <p className="mt-1 text-sm text-[#64748b]">{description}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5]">
            <Icon className="h-5 w-5" style={{ color: tone }} />
          </div>
        ) : null}
      </div>
      {trend ? <div className="mt-3"><MiniSparkline values={trend} color={tone} /></div> : null}
    </div>
  );
}
