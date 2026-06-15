import { useEffect, useState } from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import api, { downloadFile, getErrorMessage } from '../services/api';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';
import { formatCurrency } from '../utils/formatters';

export default function Reports() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadSummary() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/monthly-summary');
      setSummary(response.data.summary);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="CSV exports, printable views, and monthly operating summary for bookings, revenue, and documents."
        actions={<Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>}
      />

      {error ? <ErrorState message={error} onRetry={loadSummary} /> : null}

      <div className="grid gap-4 md:grid-cols-3 no-print">
        <button
          className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-card hover:border-brand-500"
          onClick={() => downloadFile('/reports/bookings.csv', 'bookings-report.csv')}
        >
          <Download className="h-5 w-5 text-brand-600" />
          <p className="mt-3 font-semibold text-gray-900">Bookings CSV</p>
          <p className="mt-1 text-sm text-gray-500">All cargo booking records.</p>
        </button>
        <button
          className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-card hover:border-brand-500"
          onClick={() => downloadFile('/reports/revenue.csv', 'revenue-report.csv')}
        >
          <Download className="h-5 w-5 text-brand-600" />
          <p className="mt-3 font-semibold text-gray-900">Revenue CSV</p>
          <p className="mt-1 text-sm text-gray-500">Invoice, paid, and balance rows.</p>
        </button>
        <button
          className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-card hover:border-brand-500"
          onClick={() => downloadFile('/reports/pending-documents.csv', 'pending-documents-report.csv')}
        >
          <Download className="h-5 w-5 text-brand-600" />
          <p className="mt-3 font-semibold text-gray-900">Pending Documents CSV</p>
          <p className="mt-1 text-sm text-gray-500">Open document follow-up rows.</p>
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Monthly Summary</h2>
          <Button variant="secondary" icon={RefreshCw} onClick={loadSummary}>
            Refresh
          </Button>
        </div>
        {loading ? (
          <div className="p-4"><LoadingState rows={5} /></div>
        ) : summary.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Delayed</th>
                  <th className="px-4 py-3">Invoiced</th>
                  <th className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.map((row) => (
                  <tr key={row.month}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.month}</td>
                    <td className="px-4 py-3">{row.total_bookings}</td>
                    <td className="px-4 py-3">{row.completed_shipments}</td>
                    <td className="px-4 py-3">{row.delayed_shipments}</td>
                    <td className="px-4 py-3">{formatCurrency(row.invoiced)}</td>
                    <td className="px-4 py-3">{formatCurrency(row.received)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4"><EmptyState title="No monthly data" message="Summary rows appear after bookings are created." /></div>
        )}
      </div>
    </div>
  );
}
