import { useEffect, useState } from 'react';
import { CreditCard, Edit, RefreshCw, Wallet } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import PageHeader from '../components/common/PageHeader';
import SummaryCard from '../components/common/SummaryCard';
import PaymentPanel from '../components/payments/PaymentPanel';
import StatusBadge from '../components/bookings/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadPayments() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/payments');
      setPayments(response.data.payments);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    function refreshPayments() {
      loadPayments();
    }
    window.addEventListener('orbem:refresh-payments', refreshPayments);
    return () => window.removeEventListener('orbem:refresh-payments', refreshPayments);
  }, []);

  async function savePayment(payload) {
    setSaving(true);
    setError('');
    try {
      await api.put(`/payments/${selected.booking_db_id}`, payload);
      setSelected(null);
      await loadPayments();
      window.dispatchEvent(new Event('orbem:refresh-dashboard'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const summary = payments.reduce(
    (acc, row) => ({
      invoice: acc.invoice + Number(row.invoice_amount || 0),
      paid: acc.paid + Number(row.paid_amount || 0),
      balance: acc.balance + Number(row.balance_amount || 0),
      overdue: acc.overdue + (row.payment_status === 'Overdue' ? 1 : 0)
    }),
    { invoice: 0, paid: 0, balance: 0, overdue: 0 }
  );
  const visiblePayments = statusFilter ? payments.filter((payment) => payment.payment_status === statusFilter) : payments;

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue" description="Invoice, collection, balance, overdue, partial, and paid payment tracking." actions={<Button variant="secondary" icon={RefreshCw} onClick={loadPayments}>Refresh</Button>} />
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Invoiced" value={formatCurrency(summary.invoice)} icon={CreditCard} trend={[1, 3, 5, summary.invoice / 10000]} />
        <SummaryCard title="Received" value={formatCurrency(summary.paid)} icon={Wallet} tone="#059669" trend={[1, 2, 4, summary.paid / 10000]} />
        <SummaryCard title="Pending" value={formatCurrency(summary.balance)} icon={Wallet} tone="#d97706" trend={[4, 3, 2, summary.balance / 10000]} />
        <SummaryCard title="Overdue records" value={summary.overdue} icon={CreditCard} tone="#dc2626" trend={[1, 1, 2, summary.overdue]} />
      </div>
      <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-card">
        {['', 'Pending', 'Partial', 'Paid', 'Overdue'].map((status) => (
          <Button key={status || 'all'} variant={statusFilter === status ? 'primary' : 'secondary'} onClick={() => setStatusFilter(status)}>
            {status || 'All payments'}
          </Button>
        ))}
      </div>

      {error ? <ErrorState message={error} onRetry={loadPayments} /> : null}
      {loading ? (
        <LoadingState rows={7} />
      ) : visiblePayments.length ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visiblePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{payment.booking_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{payment.customer_name}</div>
                      <div className="text-xs text-gray-500">{payment.company_name}</div>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(payment.invoice_amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.paid_amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.balance_amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={payment.payment_status} /></td>
                    <td className="px-4 py-3">{formatDate(payment.due_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" icon={Edit} onClick={() => setSelected(payment)}>
                        Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="No payment records" message="Payments will appear when bookings are created or filters are cleared." />
      )}

      <Modal title="Update payment" open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? <PaymentPanel payment={selected} onSave={savePayment} saving={saving} /> : null}
      </Modal>
    </div>
  );
}
