import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
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

  return (
    <div className="space-y-6">
      <Toast message={toast} onClose={() => setToast('')} />
      <PageHeader
        title={isShipmentsPage ? 'Shipment Operations' : 'Cargo Bookings'}
        description={isShipmentsPage ? 'Shipment route status, delivery expectations, owners, delays, and cargo movement tracking.' : 'Booking ownership, route status, cargo weight, priority, and payment state.'}
        actions={<Link to="/bookings/new"><Button icon={Plus}>New booking</Button></Link>}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Input label="Search" value={filters.q} onChange={(e) => updateFilter('q', e.target.value)} />
          <Select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            {statuses.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'All statuses'}
              </option>
            ))}
          </Select>
          <LocationAutocompleteInput
            label="Origin"
            value={filters.origin}
            onChange={updateOrigin}
            onSelect={selectOriginLocation}
            selectionValue="code"
            maxLength={12}
            placeholder="Search city or type code..."
          />
          <LocationAutocompleteInput
            label="Destination"
            value={filters.destination}
            onChange={updateDestination}
            onSelect={selectDestinationLocation}
            selectionValue="code"
            maxLength={12}
            placeholder="Search city or type code..."
          />
          <Select label="Owner" value={filters.owner} onChange={(e) => updateFilter('owner', e.target.value)}>
            <option value="">All owners</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </Select>
          <Input label="From" type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
          <Input label="To" type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" icon={X} onClick={clearFilters}>
            Clear
          </Button>
          <Button icon={Search} onClick={() => loadBookings()}>
            Search
          </Button>
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
