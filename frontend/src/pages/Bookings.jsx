import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CalendarDays, Columns3, Download, Filter, Plus, Search, Upload, X } from 'lucide-react';
import api, { downloadFile, getErrorMessage } from '../services/api';
import { bookingService } from '../services/bookingService';
import BookingTable from '../components/bookings/BookingTable';
import Button from '../components/common/Button';
import ConfirmModal from '../components/common/ConfirmModal';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import LocationAutocompleteInput from '../components/common/LocationAutocompleteInput';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';
import Select from '../components/common/Select';
import Toast from '../components/common/Toast';

const statuses = ['', 'Booked', 'Picked Up', 'In Warehouse', 'Documents Pending', 'Ready for Dispatch', 'In Transit', 'Customs Hold', 'Delivered', 'Delayed', 'Completed', 'Cancelled'];

export default function Bookings() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isShipmentsPage = location.pathname === '/shipments';
  const [bookings, setBookings] = useState([]);
  const [owners, setOwners] = useState([]);
  const [selectedOriginLocation, setSelectedOriginLocation] = useState(null);
  const [selectedDestinationLocation, setSelectedDestinationLocation] = useState(null);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    status: '',
    origin: '',
    destination: '',
    owner: '',
    dateFrom: '',
    dateTo: ''
  });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadBookings(nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
      const [bookingRows, summary] = await Promise.all([
        bookingService.list(params),
        api.get('/dashboard/summary')
      ]);
      setBookings(bookingRows);
      setOwners(summary.data.owners || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function updateOrigin(value) {
    setSelectedOriginLocation(null);
    updateFilter('origin', value.toUpperCase());
  }

  function updateDestination(value) {
    setSelectedDestinationLocation(null);
    updateFilter('destination', value.toUpperCase());
  }

  function selectOriginLocation(location) {
    setSelectedOriginLocation(location);
    updateFilter('origin', location.code);
  }

  function selectDestinationLocation(location) {
    setSelectedDestinationLocation(location);
    updateFilter('destination', location.code);
  }

  async function deleteBooking() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bookingService.remove(deleteTarget.id);
      setBookings((current) => current.filter((row) => row.id !== deleteTarget.id));
      setToast(`Booking ${deleteTarget.booking_id} deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    const reset = { q: '', status: '', origin: '', destination: '', owner: '', dateFrom: '', dateTo: '' };
    setSelectedOriginLocation(null);
    setSelectedDestinationLocation(null);
    setFilters(reset);
    loadBookings(reset);
  }

  const bookingStats = {
    total: bookings.length,
    transit: bookings.filter((booking) => ['In Transit', 'Picked Up', 'Ready for Dispatch'].includes(booking.shipment_status)).length,
    pendingDocs: bookings.filter((booking) => booking.shipment_status === 'Documents Pending').length,
    delayed: bookings.filter((booking) => booking.shipment_status === 'Delayed').length,
    cleared: bookings.filter((booking) => ['Delivered', 'Completed'].includes(booking.shipment_status)).length
  };

  const statCards = [
    ['Total active', bookingStats.total, '#172033'],
    ['In transit', bookingStats.transit, '#378add'],
    ['Pending docs', bookingStats.pendingDocs, '#ef9f27'],
    ['Delayed', bookingStats.delayed, '#e24b4a'],
    ['Cleared', bookingStats.cleared, '#1d9e75']
  ];

  return (
    <div className="space-y-4 text-[13px]">
      <Toast message={toast} onClose={() => setToast('')} />
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[17px] font-semibold text-[#172033]">{isShipmentsPage ? 'Shipment Operations' : 'Bookings'}</h1>
          <p className="mt-1 text-xs text-[#64748b]">{bookings.length || 'No'} active bookings - updated just now</p>
        </div>
        <div className="flex-1" />
        <Button variant="secondary" icon={Upload}>Import</Button>
        <Button variant="secondary" icon={Download} onClick={() => downloadFile('/reports/bookings.csv', 'bookings-report.csv')}>Export</Button>
        <Link to="/bookings/new"><Button icon={Plus} className="bg-[#0f1f3d] hover:bg-[#1a3258]">New booking</Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {statCards.map(([label, value, color]) => (
          <div key={label} className="rounded-lg border border-[#dbe3ea] bg-white px-3 py-3 text-center shadow-sm">
            <p className="text-lg font-semibold" style={{ color }}>{value}</p>
            <p className="mt-0.5 text-[10px] font-medium text-[#64748b]">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#dbe3ea] bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-9 min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-[#dbe3ea] bg-[#f8fafc] px-3 text-xs">
            <Search className="h-4 w-4 text-[#94a3b8]" />
            <input
              className="h-9 min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-[#172033] outline-none placeholder:text-[#94a3b8] focus:ring-0"
              value={filters.q}
              onChange={(event) => updateFilter('q', event.target.value)}
              placeholder="Search AWB, customer, route..."
            />
          </label>
          {[
            ['', 'All status'],
            ['In Transit', 'In transit'],
            ['Delayed', 'Delayed'],
            ['Documents Pending', 'Pending docs']
          ].map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => updateFilter('status', value)}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition ${filters.status === value ? 'border-[#1d9e75] bg-[#e1f5ee] text-[#0f6e56]' : 'border-[#dbe3ea] bg-[#f8fafc] text-[#64748b] hover:text-[#172033]'}`}
            >
              {value === '' ? <Filter className="h-3.5 w-3.5" /> : null}
              {label}
            </button>
          ))}
          <button type="button" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#dbe3ea] bg-[#f8fafc] px-3 text-[11px] font-semibold text-[#64748b]">
            <CalendarDays className="h-3.5 w-3.5" />
            Date range
          </button>
          <div className="flex-1" />
          <button type="button" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#dbe3ea] bg-[#f8fafc] px-3 text-[11px] font-semibold text-[#64748b]">
            <Columns3 className="h-3.5 w-3.5" />
            Columns
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          <LocationAutocompleteInput label="Origin" value={filters.origin} onChange={updateOrigin} onSelect={selectOriginLocation} selectionValue="code" maxLength={12} placeholder="City/code" />
          <LocationAutocompleteInput label="Destination" value={filters.destination} onChange={updateDestination} onSelect={selectDestinationLocation} selectionValue="code" maxLength={12} placeholder="City/code" />
          <Select label="Owner" value={filters.owner} onChange={(e) => updateFilter('owner', e.target.value)}>
            <option value="">All owners</option>
            {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
          </Select>
          <Input label="From" type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
          <Input label="To" type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
          <div className="flex items-end gap-2 xl:col-span-2 xl:justify-end">
            <Button variant="secondary" icon={X} onClick={clearFilters}>Clear</Button>
            <Button icon={Search} onClick={() => loadBookings()} className="bg-[#0f1f3d] hover:bg-[#1a3258]">Search</Button>
          </div>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={() => loadBookings()} /> : null}
      {loading ? <LoadingState rows={6} /> : <BookingTable bookings={bookings} onDelete={setDeleteTarget} />}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete booking?"
        message={`This will delete ${deleteTarget?.booking_id || 'this booking'} and related records. This action cannot be undone.`}
        confirmLabel="Delete booking"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteBooking}
      />
    </div>
  );
}
