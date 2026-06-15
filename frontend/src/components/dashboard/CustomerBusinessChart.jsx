import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

export default function CustomerBusinessChart({ data }) {
  return (
    <div className="h-80 rounded-lg border border-gray-200 bg-white p-4 shadow-card">
      <h2 className="text-sm font-semibold text-gray-900">Customer-wise Business</h2>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
          <YAxis dataKey="company_name" type="category" width={120} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Bar dataKey="revenue_amount" fill="#2563eb" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
