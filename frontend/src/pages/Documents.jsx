import { useEffect, useState } from 'react';
import { CheckCircle2, FileWarning, Search, XCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { getErrorMessage } from '../services/api';
import DocumentChecklist from '../components/documents/DocumentChecklist';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';
import SummaryCard from '../components/common/SummaryCard';
import StatusBadge from '../components/bookings/StatusBadge';
import { formatDate } from '../utils/formatters';

export default function Documents() {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadBookings(search = query) {
    setLoading(true);
    setError('');
    try {
      const rows = await bookingService.list({ pendingDocuments: '1', q: search || undefined });
      setBookings(rows);
      setSelected((current) => current || rows[0] || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings('');
  }, []);

  const documentStats = bookings.reduce(
    (acc, booking) => ({
      total: acc.total + 8,
      pending: acc.pending + (booking.shipment_status === 'Documents Pending' ? 1 : 0),
      verified: acc.verified,
      rejected: acc.rejected
    }),
    { total: 0, pending: 0, verified: 0, rejected: 0 }
  );
  const visibleBookings = statusFilter ? bookings.filter((booking) => booking.shipment_status === statusFilter) : bookings;

  return (
    <div className="space-y-6">
      <PageHeader title="Document Management" description="Upload metadata, verify shipment documents, record rejected reasons, and clear documentation blockers." />
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Document slots" value={documentStats.total} description="Checklist records" icon={FileWarning} />
        <SummaryCard title="Pending bookings" value={bookings.length} description="With open document work" icon={FileWarning} tone="#d97706" />
        <SummaryCard title="Verified" value={documentStats.verified} description="Loaded in checklist" icon={CheckCircle2} tone="#059669" />
        <SummaryCard title="Rejected" value={documentStats.rejected} description="Needs correction" icon={XCircle} tone="#dc2626" />
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-card">
        <Input label="Search booking" className="min-w-64 flex-1" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="h-10 self-end rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All document bookings</option>
          <option value="Documents Pending">Documents Pending</option>
          <option value="Customs Hold">Customs Hold</option>
          <option value="Ready for Dispatch">Ready for Dispatch</option>
        </select>
        <div className="flex items-end">
          <Button icon={Search} onClick={() => loadBookings()}>
            Search
          </Button>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={() => loadBookings()} /> : null}
      {loading ? (
        <LoadingState rows={6} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <div className="rounded-lg border border-gray-200 bg-white shadow-card">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Bookings With Pending Documents</h2>
            </div>
            <div className="max-h-[620px] overflow-y-auto">
              {visibleBookings.length ? (
                visibleBookings.map((booking) => (
                  <button
                    key={booking.id}
                    className={`block w-full border-b border-gray-100 px-4 py-3 text-left text-sm hover:bg-gray-50 ${selected?.id === booking.id ? 'bg-brand-50' : ''}`}
                    onClick={() => setSelected(booking)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900">{booking.booking_id}</span>
                      <StatusBadge status={booking.shipment_status} />
                    </div>
                    <p className="mt-1 text-gray-600">{booking.company_name}</p>
                    <p className="mt-1 text-xs text-gray-500">Expected {formatDate(booking.expected_delivery_date)}</p>
                  </button>
                ))
              ) : (
                <div className="p-4">
                  <EmptyState title="No pending documents" message="All matching booking documents are clear." />
                </div>
              )}
            </div>
          </div>
          <DocumentChecklist bookingId={selected?.id} />
        </div>
      )}
    </div>
  );
}
