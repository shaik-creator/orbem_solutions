import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Columns3, Download, Filter, PackageCheck, Plus, Search, Trash2, Upload, UserCheck, X } from 'lucide-react';
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
import { formatDate } from '../utils/formatters';

const statuses = ['', 'Booked', 'Picked Up', 'In Warehouse', 'Documents Pending', 'Ready for Dispatch', 'In Transit', 'Customs Hold', 'Delivered', 'Delayed', 'Completed', 'Cancelled'];

function csvCell(value) {
  const text = value === undefined || value === null || value === '' ? '-' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, columns, rows) {
  const csv = [
    columns.map((column) => csvCell(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function Bookings() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isShipmentsPage = location.pathname === '/shipments';
  const [bookings, setBookings] = useState([]);
  const [owners, setOwners] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOwnerId, setBulkOwnerId] = useState('');
  const [bulkLoading, setBulkLoading] = useState('');
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

  useEffect(() => {
    function refreshBookings() {
      loadBookings(filters);
    }
    window.addEventListener('orbem:refresh-bookings', refreshBookings);
    return () => window.removeEventListener('orbem:refresh-bookings', refreshBookings);
  }, [filters]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function toggleRowSelection(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleAllVisible() {
    const visibleIds = bookings.map((booking) => booking.id);
    const visibleSet = new Set(visibleIds);
    setSelectedIds((current) => {
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.includes(id));
      if (allSelected) return current.filter((id) => !visibleSet.has(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function clearSelection() {
    setSelectedIds([]);
    setBulkOwnerId('');
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
      setSelectedIds((current) => current.filter((id) => id !== deleteTarget.id));
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
    clearSelection();
    setFilters(reset);
    loadBookings(reset);
  }

  async function bulkUpdateStatus(status, displayLabel = status) {
    if (!selectedIds.length) return;
    setBulkLoading(`status:${status}`);
    setError('');
    try {
      const ids = [...selectedIds];
      await Promise.all(
        ids.map((id) =>
          bookingService.updateStatus(id, {
            status,
            location: 'Operations',
            remarks: `Bulk update: ${displayLabel}.`
          })
        )
      );
      await loadBookings(filters);
      clearSelection();
      setToast(`${ids.length} ${isShipmentsPage ? 'shipments' : 'bookings'} marked ${displayLabel}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBulkLoading('');
    }
  }

  async function bulkAssignOwner(ownerId = bulkOwnerId) {
    if (!selectedIds.length) return;
    if (!ownerId) {
      setToast('Choose an owner before assigning selected rows.');
      return;
    }
    setBulkLoading('owner');
    setError('');
    try {
      const ids = [...selectedIds];
      const owner = owners.find((item) => String(item.id) === String(ownerId));
      await Promise.all(ids.map((id) => bookingService.update(id, { assigned_owner_id: Number(ownerId) })));
      await loadBookings(filters);
      clearSelection();
      setToast(`${ids.length} ${isShipmentsPage ? 'shipments' : 'bookings'} assigned${owner ? ` to ${owner.name}` : ''}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBulkLoading('');
    }
  }

  async function bulkDeleteSelected() {
    if (!selectedIds.length) return;
    const label = isShipmentsPage ? 'shipments' : 'bookings';
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected ${label}?`)) return;
    setBulkLoading('delete');
    setError('');
    try {
      const ids = [...selectedIds];
      await Promise.all(ids.map((id) => bookingService.remove(id)));
      await loadBookings(filters);
      clearSelection();
      setToast(`${ids.length} selected ${label} deleted.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBulkLoading('');
    }
  }

  function bulkExportSelected() {
    const rows = bookings.filter((booking) => selectedIds.includes(booking.id));
    if (!rows.length) {
      setToast('Selected rows are not visible in the current filter.');
      return;
    }

    if (isShipmentsPage) {
      downloadCsv('selected-shipments.csv', [
        { label: 'AWB number', value: (row) => row.awb_number || row.booking_id },
        { label: 'Origin', value: (row) => row.origin_airport },
        { label: 'Destination', value: (row) => row.destination_airport },
        { label: 'Current status', value: (row) => row.shipment_status },
        { label: 'Current location', value: (row) => row.pickup_city || row.origin_airport },
        { label: 'Expected delivery', value: (row) => formatDate(row.expected_delivery_date) },
        { label: 'Delayed status', value: (row) => (row.shipment_status === 'Delayed' ? 'Delayed' : 'On track') }
      ], rows);
      setToast(`${rows.length} selected shipments exported.`);
      return;
    }

    downloadCsv('selected-bookings.csv', [
      { label: 'Booking number', value: (row) => row.booking_id },
      { label: 'AWB number', value: (row) => row.awb_number || row.booking_id },
      { label: 'Customer', value: (row) => row.customer_name },
      { label: 'Origin', value: (row) => row.origin_airport },
      { label: 'Destination', value: (row) => row.destination_airport },
      { label: 'Status', value: (row) => row.shipment_status },
      { label: 'Owner', value: (row) => row.assigned_owner || 'Unassigned' },
      { label: 'Date', value: (row) => formatDate(row.booking_date) }
    ], rows);
    setToast(`${rows.length} selected bookings exported.`);
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
  const visibleIds = bookings.map((booking) => booking.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected;
  const selectedLabel = isShipmentsPage ? 'shipments' : 'bookings';

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
      {selectedIds.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 shadow-sm">
          <p className="mr-auto text-xs font-semibold text-[#1e3a8a]">{selectedIds.length} {selectedLabel} selected</p>
          <Button variant="secondary" icon={X} className="min-h-8 px-3 py-1.5 text-xs" onClick={clearSelection}>Clear selection</Button>
          {isShipmentsPage ? (
            <>
              <Button icon={PackageCheck} loading={bulkLoading === 'status:In Transit'} className="min-h-8 bg-[#0f1f3d] px-3 py-1.5 text-xs hover:bg-[#1a3258]" onClick={() => bulkUpdateStatus('In Transit')}>Mark In Transit</Button>
              <Button icon={PackageCheck} loading={bulkLoading === 'status:Delayed'} className="min-h-8 bg-[#b42318] px-3 py-1.5 text-xs hover:bg-[#912018]" onClick={() => bulkUpdateStatus('Delayed')}>Mark Delayed</Button>
              <Button icon={CheckCircle2} loading={bulkLoading === 'status:Delivered'} className="min-h-8 px-3 py-1.5 text-xs" onClick={() => bulkUpdateStatus('Delivered')}>Mark Delivered</Button>
            </>
          ) : (
            <>
              <Button icon={CheckCircle2} loading={bulkLoading === 'status:Booked'} className="min-h-8 bg-[#0f1f3d] px-3 py-1.5 text-xs hover:bg-[#1a3258]" onClick={() => bulkUpdateStatus('Booked', 'Submitted')}>Mark Submitted</Button>
              <Button icon={CheckCircle2} loading={bulkLoading === 'status:Ready for Dispatch'} className="min-h-8 px-3 py-1.5 text-xs" onClick={() => bulkUpdateStatus('Ready for Dispatch', 'Confirmed')}>Mark Confirmed</Button>
            </>
          )}
          <Select
            aria-label={`Assign owner to selected ${selectedLabel}`}
            className="w-48 text-xs"
            value={bulkOwnerId}
            onChange={(event) => setBulkOwnerId(event.target.value)}
          >
            <option value="">Assign owner...</option>
            {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
          </Select>
          <Button variant="secondary" icon={UserCheck} loading={bulkLoading === 'owner'} className="min-h-8 px-3 py-1.5 text-xs" onClick={() => bulkAssignOwner()}>Assign Owner</Button>
          <Button variant="secondary" icon={Download} className="min-h-8 px-3 py-1.5 text-xs" onClick={bulkExportSelected}>Export selected</Button>
          <Button variant="danger" icon={Trash2} loading={bulkLoading === 'delete'} className="min-h-8 px-3 py-1.5 text-xs" onClick={bulkDeleteSelected}>Delete selected</Button>
        </div>
      ) : null}
      {loading ? (
        <LoadingState rows={6} />
      ) : (
        <BookingTable
          bookings={bookings}
          onDelete={setDeleteTarget}
          selectedIds={selectedIds}
          onToggleRowSelection={toggleRowSelection}
          onToggleAllVisible={toggleAllVisible}
          allVisibleSelected={allVisibleSelected}
          someVisibleSelected={someVisibleSelected}
          selectionType={isShipmentsPage ? 'shipment' : 'booking'}
        />
      )}

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
