import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, CreditCard, FileWarning, PackageCheck } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';
import SummaryCard from '../components/common/SummaryCard';
import StatusBadge from '../components/bookings/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadCustomer() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/customers/${id}`);
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, [id]);

  if (loading) return <LoadingState rows={8} />;
  if (error && !data) return <ErrorState message={error} onRetry={loadCustomer} />;

  const customer = data.customer;

  return (
    <div className="space-y-5">
      <PageHeader title="Customer 360" description={`${customer.customer_name} - ${customer.company_name}`} />
      {error ? <ErrorState message={error} onRetry={loadCustomer} /> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Bookings" value={customer.booking_count || 0} description="Total shipments" icon={PackageCheck} />
        <SummaryCard title="Revenue" value={formatCurrency(customer.total_revenue)} description="Total invoiced" icon={Building2} tone="#059669" />
        <SummaryCard title="Pending payments" value={formatCurrency(customer.pending_payments)} description="Outstanding balance" icon={CreditCard} tone="#d97706" />
        <SummaryCard title="Pending documents" value={customer.pending_documents || 0} description="Open document items" icon={FileWarning} tone="#dc2626" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-gray-900">Customer details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Company', customer.company_name],
              ['Email', customer.email || '-'],
              ['Phone', customer.phone || '-'],
              ['City', customer.city || '-'],
              ['Created', formatDate(customer.created_at)]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-right font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-card">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent shipments</h2>
          </div>
          {data.shipments.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <tbody className="divide-y divide-gray-100">
                  {data.shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/bookings/${shipment.id}`} className="font-semibold text-brand-700 hover:underline">{shipment.booking_id}</Link>
                        <p className="text-xs text-gray-500">{shipment.origin_airport} to {shipment.destination_airport}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={shipment.shipment_status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={shipment.priority} /></td>
                      <td className="px-4 py-3">{formatDate(shipment.expected_delivery_date)}</td>
                      <td className="px-4 py-3">{formatCurrency(shipment.balance_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4"><EmptyState title="No shipments yet" message="Bookings linked to this customer will appear here." /></div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-card">
        <div className="border-b border-gray-200 px-4 py-3"><h2 className="text-sm font-semibold text-gray-900">Complaints</h2></div>
        {data.complaints.length ? (
          <div className="divide-y divide-gray-100">
            {data.complaints.map((complaint) => (
              <div key={complaint.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{complaint.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(complaint.created_at)}</p>
                </div>
                <div className="flex gap-2"><StatusBadge status={complaint.status} /><PriorityBadge priority={complaint.priority} /></div>
              </div>
            ))}
          </div>
        ) : <div className="p-4"><EmptyState title="No complaints" message="No open complaint records for this customer." /></div>}
      </div>
    </div>
  );
}
