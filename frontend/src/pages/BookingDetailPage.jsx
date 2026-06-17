import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Check,
  ChevronRight,
  Circle,
  CreditCard,
  Edit,
  FileCheck2,
  FileText,
  FileWarning,
  Package,
  Printer,
  RefreshCw,
  Route,
  Save,
  Share2,
  Trash2,
  UserRound
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { bookingService } from '../services/bookingService';
import BookingForm from '../components/bookings/BookingForm';
import DocumentChecklist from '../components/documents/DocumentChecklist';
import PaymentPanel from '../components/payments/PaymentPanel';
import Button from '../components/common/Button';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import StatusBadge from '../components/bookings/StatusBadge';
import { classNames, formatCurrency, formatDate, formatNumber } from '../utils/formatters';

const statuses = ['Booked', 'Picked Up', 'In Warehouse', 'Documents Pending', 'Ready for Dispatch', 'In Transit', 'Customs Hold', 'Delivered', 'Delayed', 'Completed', 'Cancelled'];

function DetailCard({ title, icon: Icon, action, children }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#dbe3ea] bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-[#edf2f7] px-4 py-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[#172033]">
          {Icon ? <Icon className="h-4 w-4 text-[#64748b]" /> : null}
          {title}
        </h2>
        {action ? <div className="text-[11px] font-semibold text-[#1d9e75]">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function InfoGrid({ booking }) {
  const rows = [
    ['Airline AWB', booking.awb_number || booking.booking_id, 'mono'],
    ['Flight number', booking.flight_number || 'Not assigned', 'mono'],
    ['Actual weight', `${formatNumber(booking.actual_weight, 0)} kg`],
    ['Chargeable weight', `${formatNumber(booking.chargeable_weight, 0)} kg`, 'green'],
    ['Dimensions (L x W x H)', `${formatNumber(booking.length_cm, 0)} x ${formatNumber(booking.width_cm, 0)} x ${formatNumber(booking.height_cm, 0)} cm`],
    ['Volume weight', `${formatNumber(booking.volumetric_weight, 0)} kg`],
    ['Commodity', booking.cargo_type || '-'],
    ['Packages', formatNumber(booking.package_count, 0)],
    ['Departure', formatDate(booking.booking_date)],
    [`ETA at ${booking.destination_airport || 'destination'}`, formatDate(booking.expected_delivery_date)]
  ];

  return (
    <div className="grid sm:grid-cols-2">
      {rows.map(([label, value, tone], index) => (
        <div key={label} className={classNames('border-b border-[#edf2f7] px-4 py-3 sm:odd:border-r', index >= rows.length - 2 ? 'sm:border-b-0' : '')}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.03em] text-[#64748b]">{label}</p>
          <p className={classNames('mt-1 text-[13px] font-semibold text-[#172033]', tone === 'mono' ? 'orbem-mono text-xs' : '', tone === 'green' ? 'text-[#1d9e75]' : '')}>{value || '-'}</p>
        </div>
      ))}
    </div>
  );
}

function TimelineCard({ milestones }) {
  const visible = milestones.length ? milestones : [];

  return (
    <DetailCard title="Shipment timeline" icon={Route} action="Add update">
      <div className="px-4 py-4">
        {visible.length ? (
          <div>
            {visible.map((milestone, index) => {
              const active = index === visible.length - 1;
              const complete = !active;
              return (
                <div key={milestone.id || milestone.created_at || index} className="relative flex gap-3">
                  {index < visible.length - 1 ? <span className="absolute left-[10px] top-7 h-[calc(100%-8px)] w-px bg-[#dbe3ea]" /> : null}
                  <span className={classNames('relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white', complete ? 'bg-[#1d9e75]' : active ? 'bg-[#378add] ring-4 ring-[#e6f1fb]' : 'bg-[#edf2f7] text-[#94a3b8]')}>
                    {complete ? <Check className="h-3 w-3" /> : active ? <Route className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1 pb-4">
                    <p className={classNames('text-xs font-semibold', active ? 'text-[#185fa5]' : 'text-[#172033]')}>{milestone.status}</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#64748b]">{milestone.remarks || 'Shipment milestone updated.'}</p>
                    <p className="mt-1 text-[10px] text-[#94a3b8]">{formatDate(milestone.created_at)} - {milestone.updated_by || milestone.created_by_name || 'System'}</p>
                    {milestone.location ? <span className="mt-2 inline-flex rounded border border-[#dbe3ea] bg-[#f8fafc] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#64748b]">{milestone.location}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#64748b]">No milestones recorded.</p>
        )}
      </div>
    </DetailCard>
  );
}

function DocumentsCard({ documents }) {
  const meta = {
    Verified: { icon: FileCheck2, className: 'bg-[#eaf3de] text-[#3b6d11]' },
    Received: { icon: FileText, className: 'bg-[#e6f1fb] text-[#185fa5]' },
    Pending: { icon: FileWarning, className: 'bg-[#faeeda] text-[#854f0b]' },
    Rejected: { icon: FileWarning, className: 'bg-[#fcebeb] text-[#a32d2d]' }
  };
  const verifiedCount = documents.filter((doc) => doc.status === 'Verified').length;

  return (
    <DetailCard title="Document checklist" icon={FileText} action="Upload">
      <div className="divide-y divide-[#edf2f7]">
        {documents.map((document) => {
          const item = meta[document.status] || meta.Pending;
          const Icon = item.icon;
          return (
            <div key={document.id} className="flex items-center gap-3 px-4 py-3">
              <span className={classNames('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', item.className)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#172033]">{document.document_type}</p>
                <p className="mt-0.5 truncate text-[10px] text-[#64748b]">{document.file_name || 'Metadata pending'}</p>
              </div>
              <StatusBadge status={document.status} />
            </div>
          );
        })}
        {!documents.length ? <p className="px-4 py-4 text-sm text-[#64748b]">No documents attached yet.</p> : null}
      </div>
      {documents.length ? (
        <div className="flex items-center justify-between border-t border-[#edf2f7] px-4 py-3 text-[11px]">
          <span className="font-semibold text-[#1d9e75]">{verifiedCount}/{documents.length} documents verified</span>
          <span className="text-[#64748b]">Last checked just now</span>
        </div>
      ) : null}
    </DetailCard>
  );
}

function PaymentSummaryCard({ booking }) {
  const invoice = Number(booking.invoice_amount || 0);
  const paid = Number(booking.paid_amount || 0);
  const balance = Number(booking.balance_amount || Math.max(invoice - paid, 0));
  const rows = [
    ['Quotation', formatCurrency(booking.quotation_amount)],
    ['Total invoice', formatCurrency(invoice), 'strong'],
    ['Amount received', formatCurrency(paid), 'green'],
    ['Balance due', balance ? formatCurrency(balance) : '0 - Paid', balance ? 'red' : 'green'],
    ['Payment method', booking.payment_method || '-']
  ];

  return (
    <DetailCard title="Payment" icon={CreditCard} action="Record payment">
      <div className="divide-y divide-[#edf2f7]">
        {rows.map(([label, value, tone]) => (
          <div key={label} className={classNames('flex items-center justify-between gap-3 px-4 py-3', tone === 'strong' ? 'bg-[#f8fafc]' : '')}>
            <p className="text-[11px] font-medium text-[#64748b]">{label}</p>
            <p className={classNames('text-[13px] font-semibold text-[#172033]', tone === 'green' ? 'text-[#1d9e75]' : '', tone === 'red' ? 'text-[#e24b4a]' : '', tone === 'strong' ? 'text-[15px]' : '')}>{value}</p>
          </div>
        ))}
      </div>
    </DetailCard>
  );
}

function CustomerCard({ booking }) {
  const initials = String(booking.company_name || booking.customer_name || 'Customer')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <DetailCard title="Customer" icon={UserRound} action="View 360">
      <div className="flex gap-3 px-4 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6f1fb] text-xs font-bold text-[#185fa5]">{initials}</span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#172033]">{booking.company_name || booking.customer_name}</p>
          <p className="mt-1 truncate text-[11px] text-[#64748b]">{booking.customer_email || '-'}</p>
          <p className="mt-1 truncate text-[11px] text-[#64748b]">{booking.customer_phone || '-'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#eaf3de] px-2 py-0.5 text-[10px] font-bold text-[#3b6d11]">Priority client</span>
            <span className="rounded-full bg-[#e6f1fb] px-2 py-0.5 text-[10px] font-bold text-[#185fa5]">{booking.pickup_city || 'Origin'} to {booking.delivery_city || 'Destination'}</span>
          </div>
        </div>
      </div>
    </DetailCard>
  );
}

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
    <div className="space-y-4 text-[13px]">
      <nav className="flex items-center gap-1.5 text-[11px] font-medium text-[#64748b]">
        <Link to="/" className="hover:text-[#172033]">Dashboard</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/bookings" className="hover:text-[#172033]">Bookings</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-[#172033]">{data.booking.booking_id}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="orbem-mono text-[18px] font-semibold text-[#172033]">{data.booking.booking_id}</h1>
            <StatusBadge status={data.booking.shipment_status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748b]">
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{data.booking.company_name}</span>
            <span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5" />{data.booking.origin_airport} to {data.booking.destination_airport}</span>
            <span>Booked {formatDate(data.booking.booking_date)}</span>
          </p>
        </div>
        <div className="flex-1" />
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
        <Button variant="secondary" icon={Share2} onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share</Button>
        <Button icon={Edit} onClick={() => setSearchParams({ edit: '1' })} className="bg-[#0f1f3d] hover:bg-[#1a3258]">Edit booking</Button>
      </div>

      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <div className="space-y-4">
          <DetailCard title="Cargo details" icon={Package} action={<button type="button" onClick={() => setSearchParams({ edit: '1' })}>Edit</button>}>
            <InfoGrid booking={data.booking} />
          </DetailCard>
          <TimelineCard milestones={data.milestones || []} />
        </div>

        <div className="space-y-4">
          <DocumentsCard documents={data.documents || []} />
          <PaymentSummaryCard booking={data.booking} />
          <CustomerCard booking={data.booking} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-[#dbe3ea] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#172033]">Update Shipment Status</h2>
            <Button variant="secondary" icon={RefreshCw} onClick={loadBooking} className="min-h-9 px-3 text-xs">Refresh</Button>
          </div>
          <form className="mt-4 space-y-4" onSubmit={updateStatus}>
            <Select label="Status" value={statusForm.status} options={statuses} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} />
            <Input label="Location" value={statusForm.location} onChange={(e) => setStatusForm({ ...statusForm, location: e.target.value })} />
            <Input label="Remarks" value={statusForm.remarks} onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })} />
            <Button type="submit" icon={Save} loading={saving}>
              Save status
            </Button>
          </form>
        </div>
        <div className="rounded-lg border border-[#dbe3ea] bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-[#172033]">Payment Update</h2>
          <PaymentPanel payment={data.booking} onSave={updatePayment} saving={saving} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#172033]">Document Management</h2>
        <DocumentChecklist bookingId={data.booking.id} />
      </div>

      <div className="flex justify-end">
        <Button variant="danger" icon={Trash2} onClick={deleteBooking}>Delete booking</Button>
      </div>

      <Modal title="Edit booking" open={editing} onClose={() => setSearchParams({})} size="max-w-5xl">
        <BookingForm initialData={data.booking} owners={owners} onSubmit={updateBooking} submitting={saving} submitLabel="Save changes" />
      </Modal>
    </div>
  );
}
