import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Edit, RefreshCw, Save, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { bookingService } from '../services/bookingService';
import BookingDetails from '../components/bookings/BookingDetails';
import BookingForm from '../components/bookings/BookingForm';
import DocumentChecklist from '../components/documents/DocumentChecklist';
import PaymentPanel from '../components/payments/PaymentPanel';
import Button from '../components/common/Button';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import PageHeader from '../components/common/PageHeader';

const statuses = ['Booked', 'Picked Up', 'In Warehouse', 'Documents Pending', 'Ready for Dispatch', 'In Transit', 'Customs Hold', 'Delivered', 'Delayed', 'Completed', 'Cancelled'];

export default function BookingDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [owners, setOwners] = useState([]);
  const [statusForm, setStatusForm] = useState({ status: '', location: '', remarks: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editing = searchParams.get('edit') === '1';

  async function loadBooking() {
    setLoading(true);
    setError('');
    try {
      const [booking, summary] = await Promise.all([bookingService.get(id), api.get('/dashboard/summary')]);
      setData(booking);
      setOwners(summary.data.owners || []);
      setStatusForm({ status: booking.booking.shipment_status, location: booking.booking.pickup_city || '', remarks: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooking();
  }, [id]);

  async function updateBooking(payload) {
    setSaving(true);
    setError('');
    try {
      await bookingService.update(data.booking.id, payload);
      setSearchParams({});
      await loadBooking();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await bookingService.updateStatus(data.booking.id, statusForm);
      await loadBooking();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updatePayment(payload) {
    setSaving(true);
    setError('');
    try {
      await api.put(`/payments/${data.booking.id}`, payload);
      await loadBooking();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteBooking() {
    if (!window.confirm(`Delete booking ${data.booking.booking_id}?`)) return;
    try {
      await bookingService.remove(data.booking.id);
      navigate('/bookings');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <LoadingState rows={8} />;
  if (error && !data) return <ErrorState message={error} onRetry={loadBooking} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Details"
        description={`${data.booking.customer_name} - ${data.booking.company_name}`}
        statusText={data.booking.shipment_status}
        actions={(
          <>
          <Button variant="secondary" icon={RefreshCw} onClick={loadBooking}>
            Refresh
          </Button>
          <Button variant="secondary" icon={Edit} onClick={() => setSearchParams({ edit: '1' })}>
            Edit
          </Button>
          <Button variant="danger" icon={Trash2} onClick={deleteBooking}>
            Delete
          </Button>
          </>
        )}
      />

      {error ? <ErrorState message={error} /> : null}

      <BookingDetails booking={data.booking} milestones={data.milestones} />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-gray-900">Update Shipment Status</h2>
          <form className="mt-4 space-y-4" onSubmit={updateStatus}>
            <Select label="Status" value={statusForm.status} options={statuses} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} />
            <Input label="Location" value={statusForm.location} onChange={(e) => setStatusForm({ ...statusForm, location: e.target.value })} />
            <Input label="Remarks" value={statusForm.remarks} onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })} />
            <Button type="submit" icon={Save} loading={saving}>
              Save status
            </Button>
          </form>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Payment Update</h2>
          <PaymentPanel payment={data.booking} onSave={updatePayment} saving={saving} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Document Checklist</h2>
        <DocumentChecklist bookingId={data.booking.id} />
      </div>

      <Modal title="Edit booking" open={editing} onClose={() => setSearchParams({})} size="max-w-5xl">
        <BookingForm initialData={data.booking} owners={owners} onSubmit={updateBooking} submitting={saving} submitLabel="Save changes" />
      </Modal>
    </div>
  );
}
