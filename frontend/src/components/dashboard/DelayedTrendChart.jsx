import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function DelayedTrendChart({ data }) {
  return (
    <div className="h-80 rounded-lg border border-gray-200 bg-white p-4 shadow-card">
      <h2 className="text-sm font-semibold text-gray-900">Delayed Shipments Trend</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month_key" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="delayed_count" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
