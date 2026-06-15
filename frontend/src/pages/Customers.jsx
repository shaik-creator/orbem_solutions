import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, Plus, RefreshCw, UsersRound } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import PageHeader from '../components/common/PageHeader';
import SearchFilterBar from '../components/common/SearchFilterBar';
import SummaryCard from '../components/common/SummaryCard';
import Toast from '../components/common/Toast';
import { formatCurrency, formatDate } from '../utils/formatters';

const emptyForm = { customer_name: '', company_name: '', email: '', phone: '', city: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadCustomers(search = q) {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/customers', { params: search ? { q: search } : {} });
      setCustomers(response.data.customers || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers('');
  }, []);

  async function createCustomer(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/customers', form);
      setCreating(false);
      setForm(emptyForm);
      setToast('Customer created.');
      await loadCustomers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const totals = customers.reduce(
    (acc, customer) => ({
      bookings: acc.bookings + Number(customer.booking_count || 0),
      revenue: acc.revenue + Number(customer.total_revenue || 0),
      pending: acc.pending + Number(customer.pending_payments || 0)
    }),
    { bookings: 0, revenue: 0, pending: 0 }
  );

  return (
    <div className="space-y-5">
      <Toast message={toast} onClose={() => setToast('')} />
      <PageHeader
        title="Customers"
        description="Customer 360 records, shipment history, revenue, and pending balances."
        actions={<><Button variant="secondary" icon={RefreshCw} onClick={() => loadCustomers()}>Refresh</Button><Button icon={Plus} onClick={() => setCreating(true)}>New customer</Button></>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Customers" value={customers.length} description="Active customer records" icon={UsersRound} trend={[2, 3, 5, customers.length]} />
        <SummaryCard title="Total bookings" value={totals.bookings} description="Across listed customers" icon={Building2} tone="#059669" trend={[1, 4, 6, totals.bookings]} />
        <SummaryCard title="Pending payments" value={formatCurrency(totals.pending)} description="Outstanding customer balance" icon={Phone} tone="#d97706" trend={[1, 2, 1, totals.pending / 1000]} />
      </div>

      <SearchFilterBar
        value={q}
        onChange={setQ}
        onSearch={() => loadCustomers()}
        onClear={() => { setQ(''); loadCustomers(''); }}
        placeholder="Search customer, company, city, email"
      />

      {error ? <ErrorState message={error} onRetry={() => loadCustomers()} /> : null}
      {loading ? (
        <LoadingState rows={6} />
      ) : customers.length ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Last booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/customers/${customer.id}`} className="font-semibold text-brand-700 hover:underline">{customer.customer_name}</Link>
                      <p className="text-xs text-gray-500">{customer.company_name} {customer.city ? `- ${customer.city}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {customer.email || '-'}</div>
                      <div className="mt-1 flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3">{customer.booking_count || 0}</td>
                    <td className="px-4 py-3">{formatCurrency(customer.total_revenue)}</td>
                    <td className="px-4 py-3">{formatCurrency(customer.pending_payments)}</td>
                    <td className="px-4 py-3">{formatDate(customer.last_booking_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="No customers found" message="Create a customer profile to start Customer 360 tracking." actionLabel="New customer" onAction={() => setCreating(true)} />
      )}

      <Modal title="New customer" open={creating} onClose={() => setCreating(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={createCustomer}>
          <Input label="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
          <Input label="Company name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <div className="flex items-end justify-end md:col-span-2"><Button type="submit" loading={saving}>Save customer</Button></div>
        </form>
      </Modal>
    </div>
  );
}
