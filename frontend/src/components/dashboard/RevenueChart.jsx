import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function RevenueChart({ data = [], onExport }) {
  const displayData = data.slice(-8);
  const totals = displayData.reduce(
    (sum, row) => ({
      invoiced: sum.invoiced + Number(row.invoiced_amount || 0),
      received: sum.received + Number(row.received_amount || 0),
      pending: sum.pending + Number(row.pending_amount || 0)
    }),
    { invoiced: 0, received: 0, pending: 0 }
  );

  return (
    <section className="overflow-hidden rounded-lg border border-[#dbe3ea] bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe3ea] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">Revenue - last 8 periods</h2>
          <p className="mt-0.5 text-xs text-[#64748b]">Invoiced, received, and pending balances.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[#1d9e75] transition hover:bg-[#eaf7f2]"
          onClick={onExport}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      <div className="h-64 px-2 pb-3 pt-4 sm:px-4">
        {displayData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5edf3" vertical={false} />
              <XAxis dataKey="month_key" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#eef2f5' }} />
              <Bar dataKey="invoiced_amount" fill="#378add" name="Invoiced" radius={[4, 4, 0, 0]} />
              <Bar dataKey="received_amount" fill="#1d9e75" name="Received" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending_amount" fill="#ef9f27" name="Pending" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[#dbe3ea] text-sm text-[#64748b]">
            Revenue data will appear after bookings are invoiced.
          </div>
        )}
      </div>

      <div className="grid border-t border-[#dbe3ea] sm:grid-cols-3">
        <div className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">Total invoiced</p>
          <p className="mt-1 text-base font-semibold text-[#111827]">{formatCurrency(totals.invoiced)}</p>
        </div>
        <div className="border-t border-[#dbe3ea] px-4 py-3 sm:border-l sm:border-t-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">Collected</p>
          <p className="mt-1 text-base font-semibold text-[#1d9e75]">{formatCurrency(totals.received)}</p>
        </div>
        <div className="border-t border-[#dbe3ea] px-4 py-3 sm:border-l sm:border-t-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">Open balance</p>
          <p className="mt-1 text-base font-semibold text-[#e24b4a]">{formatCurrency(totals.pending)}</p>
        </div>
      </div>
    </section>
  );
}
