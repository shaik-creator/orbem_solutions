import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#475569', '#16a34a'];

export default function StatusPieChart({ data }) {
  return (
    <div className="h-80 rounded-lg border border-gray-200 bg-white p-4 shadow-card">
      <h2 className="text-sm font-semibold text-gray-900">Shipment Status</h2>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie data={data} dataKey="status_count" nameKey="shipment_status" innerRadius={55} outerRadius={92} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.shipment_status} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={44} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
