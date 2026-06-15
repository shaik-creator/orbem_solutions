import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BellRing,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileUp,
  FileWarning,
  Filter,
  PackageCheck,
  PackagePlus,
  PlaneLanding,
  PlaneTakeoff,
  Receipt,
  Search,
  UploadCloud,
  Wallet
} from 'lucide-react';
import api, { downloadFile, getErrorMessage } from '../services/api';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import LocationAutocompleteInput from '../components/common/LocationAutocompleteInput';
import LoadingState from '../components/common/LoadingState';
import Select from '../components/common/Select';
import Toast from '../components/common/Toast';
import StatusBadge from '../components/bookings/StatusBadge';
import RevenueChart from '../components/dashboard/RevenueChart';
import PageHeader from '../components/common/PageHeader';
import { classNames, formatCurrency, formatDate, formatNumber } from '../utils/formatters';

const statuses = ['', 'Booked', 'Picked Up', 'In Warehouse', 'Documents Pending', 'Ready for Dispatch', 'In Transit', 'Customs Hold', 'Delivered', 'Delayed', 'Completed', 'Cancelled'];

const toneStyles = {
  green: {
    icon: 'bg-[#eaf7f2] text-[#0f6e56]',
    pill: 'bg-[#eaf7f2] text-[#0f6e56]',
    bar: '#1d9e75'
  },
  blue: {
    icon: 'bg-[#e6f1fb] text-[#185fa5]',
    pill: 'bg-[#e6f1fb] text-[#185fa5]',
    bar: '#378add'
  },
  amber: {
    icon: 'bg-[#faeeda] text-[#854f0b]',
    pill: 'bg-[#faeeda] text-[#854f0b]',
    bar: '#ef9f27'
  },
  red: {
    icon: 'bg-[#fcebeb] text-[#a32d2d]',
    pill: 'bg-[#fcebeb] text-[#a32d2d]',
    bar: '#e24b4a'
  },
  gray: {
    icon: 'bg-[#eef2f5] text-[#64748b]',
    pill: 'bg-[#eef2f5] text-[#475569]',
    bar: '#64748b'
  }
};

const statusColors = {
  Booked: '#64748b',
  'Picked Up': '#378add',
  'In Warehouse': '#6366f1',
  'Documents Pending': '#ef9f27',
  'Ready for Dispatch': '#378add',
  'In Transit': '#378add',
  'Customs Hold': '#ef9f27',
  Delivered: '#1d9e75',
  Delayed: '#e24b4a',
  Completed: '#1d9e75',
  Cancelled: '#64748b'
};

function routeLabel(row) {
  if (!row?.origin_airport && !row?.destination_airport) return 'Route pending';
  return `${row.origin_airport || '---'} to ${row.destination_airport || '---'}`;
}

function Panel({ title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <section className={classNames('overflow-hidden rounded-lg border border-[#dbe3ea] bg-white shadow-card', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe3ea] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2f5] text-[#64748b]">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[#111827]">{title}</h2>
            {subtitle ? <p className="mt-0.5 truncate text-xs text-[#64748b]">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Pill({ tone = 'gray', icon: Icon, children }) {
  const style = toneStyles[tone] || toneStyles.gray;
  return (
    <span className={classNames('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', style.pill)}>
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}

function KpiCard({ label, value, icon: Icon, tone = 'green', progress = 50, children }) {
  const style = toneStyles[tone] || toneStyles.green;
  const width = `${Math.max(6, Math.min(Number(progress) || 0, 100))}%`;

  return (
    <article className="rounded-lg border border-[#dbe3ea] bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold leading-none text-[#111827]">{value}</p>
          <div className="mt-2 flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-[#64748b]">{children}</div>
        </div>
        {Icon ? (
          <span className={classNames('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', style.icon)}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eef2f5]">
        <div className="h-full rounded-full" style={{ width, background: style.bar }} />
      </div>
    </article>
  );
}

function FilterPanel({
  filters,
  owners,
  updateFilter,
  navigate,
  exportReport,
  originQuery,
  destinationQuery,
  onOriginChange,
  onDestinationChange,
  onOriginLocationSelect,
  onDestinationLocationSelect,
  onApplyFilters,
  onClearFilters
}) {
  return (
    <section className="rounded-lg border border-[#dbe3ea] bg-white p-4 shadow-card no-print">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f5] text-[#64748b]">
            <Filter className="h-4 w-4" />
          </span>
          Operations filters
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={PackagePlus} onClick={() => navigate('/bookings/new')}>New Booking</Button>
          <Button variant="secondary" icon={FileUp} onClick={() => navigate('/documents')}>Upload Document</Button>
          <Button variant="secondary" icon={Bot} onClick={() => window.dispatchEvent(new Event('orbem:open-assistant'))}>Assistant</Button>
          <Button variant="secondary" icon={Receipt} onClick={exportReport}>Export</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Input label="From" type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} />
        <Input label="To" type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} />
        <Select label="Status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'All statuses'}</option>)}
        </Select>
        <Input label="Customer" value={filters.customer} onChange={(event) => updateFilter('customer', event.target.value)} />
        <LocationAutocompleteInput
          label="Origin"
          value={originQuery}
          onChange={onOriginChange}
          onSelect={onOriginLocationSelect}
          placeholder="Search city, airport, address..."
        />
        <LocationAutocompleteInput
          label="Destination"
          value={destinationQuery}
          onChange={onDestinationChange}
          onSelect={onDestinationLocationSelect}
          placeholder="Search city, airport, address..."
        />
        <Select label="Owner" value={filters.owner} onChange={(event) => updateFilter('owner', event.target.value)}>
          <option value="">All owners</option>
          {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
        </Select>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClearFilters}>Clear</Button>
        <Button icon={Search} onClick={onApplyFilters}>Apply filters</Button>
      </div>
    </section>
  );
}

function StatusBreakdown({ rows, operations }) {
  const total = rows.reduce((sum, row) => sum + Number(row.status_count || 0), 0);
  const visibleRows = rows.slice(0, 6);

  return (
    <Panel
      title="Shipment status"
      subtitle={`${formatNumber(total, 0)} shipments in current view`}
      icon={CheckCircle2}
      action={<Link to="/bookings" className="text-xs font-semibold text-[#1d9e75] hover:underline">View all</Link>}
    >
      <div className="p-4">
        {visibleRows.length ? (
          <div className="space-y-3">
            {visibleRows.map((row) => {
              const color = statusColors[row.shipment_status] || '#64748b';
              const percent = total ? Math.round((Number(row.status_count || 0) / total) * 100) : 0;
              return (
                <div key={row.shipment_status} className="grid grid-cols-[minmax(0,1fr)_92px_42px] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="truncate text-sm text-[#111827]">{row.shipment_status}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#eef2f5]">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(percent, row.status_count ? 5 : 0)}%`, background: color }} />
                  </div>
                  <span className="text-right text-sm font-semibold text-[#111827]">{formatNumber(row.status_count, 0)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No shipment status data" message="Shipment status totals will appear once bookings are available." />
        )}

        <div className="mt-4 border-t border-[#dbe3ea] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Today's operations</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-[#111827]">
              <PlaneTakeoff className="h-4 w-4 text-[#1d9e75]" />
              <span>{formatNumber(operations.shipmentsExpectedToday, 0)} expected shipments</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#111827]">
              <PlaneLanding className="h-4 w-4 text-[#378add]" />
              <span>{formatNumber(operations.pickupsScheduledToday, 0)} scheduled pickups</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#111827]">
              <UploadCloud className="h-4 w-4 text-[#ef9f27]" />
              <span>{formatNumber(operations.bookingsCreatedToday, 0)} bookings created</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#111827]">
              <Wallet className="h-4 w-4 text-[#e24b4a]" />
              <span>{formatNumber(operations.paymentsDueToday, 0)} payments due</span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RecentBookings({ rows }) {
  return (
    <Panel
      title="Recent bookings"
      subtitle={`${formatNumber(rows.length, 0)} latest operational records`}
      icon={PackageCheck}
      action={<Link to="/bookings" className="text-xs font-semibold text-[#1d9e75] hover:underline">View all</Link>}
    >
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dbe3ea] bg-[#f5f7fa] text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                <th className="px-4 py-3">AWB / Route</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Chg Wt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {rows.slice(0, 6).map((row) => (
                <tr key={row.id} className="transition hover:bg-[#f8fafc]">
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-[#0f1f3d] hover:text-[#1d9e75] hover:underline" to={`/bookings/${row.id}`}>{row.booking_id}</Link>
                    <p className="mt-1 text-xs text-[#64748b]">{routeLabel(row)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#111827]">{row.company_name || row.customer_name}</p>
                    <p className="mt-1 text-xs text-[#64748b]">{row.assigned_owner || 'Unassigned'} / {row.payment_status || 'No payment'}</p>
                  </td>
                  <td className="px-4 py-3 text-[#111827]">{row.chargeable_weight ? `${formatNumber(row.chargeable_weight, 0)} kg` : '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.shipment_status} /></td>
                  <td className="px-4 py-3 text-[#64748b]">{formatDate(row.expected_delivery_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4"><EmptyState title="No recent bookings" message="Create a cargo booking to start tracking operations." /></div>
      )}
    </Panel>
  );
}

function buildAlerts(tables, activity) {
  const delayed = (tables.delayedShipments || []).slice(0, 2).map((row) => ({
    key: `delayed-${row.id}`,
    tone: 'red',
    icon: AlertCircle,
    title: `${row.booking_id} delayed`,
    description: `${row.customer_name || 'Customer'} / ${routeLabel(row)} / owner ${row.assigned_owner || 'unassigned'}`,
    time: formatDate(row.expected_delivery_date),
    to: `/bookings/${row.id}`
  }));

  const documents = (tables.pendingDocuments || []).slice(0, 2).map((row) => ({
    key: `docs-${row.id}`,
    tone: 'amber',
    icon: FileWarning,
    title: `Documents pending - ${row.booking_id}`,
    description: row.pending_documents || 'Document review required',
    time: row.customer_name || row.company_name || 'Customer pending',
    to: `/bookings/${row.id}`
  }));

  const payments = (tables.pendingPayments || []).slice(0, 2).map((row) => ({
    key: `payments-${row.id}`,
    tone: row.payment_status === 'Overdue' ? 'red' : 'blue',
    icon: Wallet,
    title: `${row.payment_status || 'Payment'} - ${row.booking_id}`,
    description: `${row.customer_name || 'Customer'} / balance ${formatCurrency(row.balance_amount)}`,
    time: `Due ${formatDate(row.due_date)}`,
    to: '/payments'
  }));

  const activityAlerts = (activity || []).slice(0, 2).map((row, index) => ({
    key: `activity-${row.related_id || index}-${row.created_at}`,
    tone: 'blue',
    icon: BellRing,
    title: row.title || 'Recent activity',
    description: row.description || row.action_type || 'Operational update',
    time: formatDate(row.created_at),
    to: row.related_type === 'booking' && row.related_id ? `/bookings/${row.related_id}` : '/notifications'
  }));

  return [...delayed, ...documents, ...payments, ...activityAlerts].slice(0, 4);
}

function AlertCenter({ tables, activity, runningAlert, onRunAlertCheck }) {
  const alerts = buildAlerts(tables, activity);

  return (
    <Panel
      title="Alert center"
      subtitle="Operational blockers and follow-ups"
      icon={BellRing}
      action={
        <button type="button" className="text-xs font-semibold text-[#1d9e75] hover:underline" onClick={onRunAlertCheck} disabled={runningAlert}>
          {runningAlert ? 'Checking...' : 'Run check'}
        </button>
      }
    >
      <div className="space-y-2 p-4">
        {alerts.length ? (
          alerts.map((alert) => {
            const Icon = alert.icon;
            const style = toneStyles[alert.tone] || toneStyles.blue;
            return (
              <Link key={alert.key} to={alert.to} className="flex items-start gap-3 rounded-lg border border-[#dbe3ea] bg-[#f8fafc] p-3 transition hover:border-[#b8c7d6] hover:bg-white">
                <span className={classNames('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', style.icon)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#111827]">{alert.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#64748b]">{alert.description}</span>
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-[#94a3b8]">
                    <Clock className="h-3 w-3" />
                    {alert.time}
                  </span>
                </span>
              </Link>
            );
          })
        ) : (
          <EmptyState title="No active alerts" message="Delayed shipments, pending documents, and overdue payments will appear here." />
        )}
      </div>
    </Panel>
  );
}

function OperationsStrip({ operations }) {
  const items = [
    { label: 'Bookings today', value: operations.bookingsCreatedToday, icon: PackagePlus, tone: 'green' },
    { label: 'Expected today', value: operations.shipmentsExpectedToday, icon: CalendarClock, tone: 'blue' },
    { label: 'Pending docs', value: operations.documentsPendingToday, icon: FileWarning, tone: 'amber' },
    { label: 'Delayed today', value: operations.delayedShipmentsToday, icon: AlertCircle, tone: 'red' }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const style = toneStyles[item.tone] || toneStyles.gray;
        return (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border border-[#dbe3ea] bg-white px-4 py-3 shadow-card">
            <span className={classNames('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', style.icon)}>
              <Icon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-lg font-semibold leading-none text-[#111827]">{formatNumber(item.value, 0)}</span>
              <span className="mt-1 block text-xs text-[#64748b]">{item.label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '', customer: '', origin: '', destination: '', owner: '' });
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [selectedOriginLocation, setSelectedOriginLocation] = useState(null);
  const [selectedDestinationLocation, setSelectedDestinationLocation] = useState(null);
  const [data, setData] = useState(null);
  const [charts, setCharts] = useState({ revenue: [], statuses: [] });
  const [today, setToday] = useState({ operations: {} });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningAlert, setRunningAlert] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadDashboard(nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
      const [summary, revenue, status, todayResponse, activityResponse] = await Promise.all([
        api.get('/dashboard/summary', { params }),
        api.get('/dashboard/revenue'),
        api.get('/dashboard/status'),
        api.get('/dashboard/today'),
        api.get('/activity/recent', { params: { limit: 12 } })
      ]);
      setFilters(nextFilters);
      setData(summary.data);
      setCharts({
        revenue: revenue.data.revenue || [],
        statuses: status.data.statuses || []
      });
      setToday(todayResponse.data || { operations: {} });
      setActivity(activityResponse.data.activity || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    function refreshDashboard() {
      loadDashboard(filters);
    }

    window.addEventListener('orbem:refresh-dashboard', refreshDashboard);
    return () => window.removeEventListener('orbem:refresh-dashboard', refreshDashboard);
  }, [filters]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function updateOriginQuery(value) {
    setOriginQuery(value);
    setSelectedOriginLocation(null);
    updateFilter('origin', value);
  }

  function updateDestinationQuery(value) {
    setDestinationQuery(value);
    setSelectedDestinationLocation(null);
    updateFilter('destination', value);
  }

  function selectOriginLocation(location) {
    setSelectedOriginLocation(location);
    setOriginQuery(location.fullAddress);
    updateFilter('origin', location.fullAddress);
  }

  function selectDestinationLocation(location) {
    setSelectedDestinationLocation(location);
    setDestinationQuery(location.fullAddress);
    updateFilter('destination', location.fullAddress);
  }

  async function applyFilters() {
    const nextFilters = {
      ...filters,
      origin: selectedOriginLocation?.fullAddress || originQuery.trim(),
      destination: selectedDestinationLocation?.fullAddress || destinationQuery.trim()
    };

    await loadDashboard(nextFilters);
  }

  function clearFiltersAndLocations() {
    const reset = { dateFrom: '', dateTo: '', status: '', customer: '', origin: '', destination: '', owner: '' };
    setOriginQuery('');
    setDestinationQuery('');
    setSelectedOriginLocation(null);
    setSelectedDestinationLocation(null);
    loadDashboard(reset);
  }

  async function runAlertCheck() {
    setRunningAlert(true);
    try {
      const response = await api.post('/notifications/run-alert-check');
      setToast(response.data.message || 'Alert check completed.');
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRunningAlert(false);
    }
  }

  async function exportReport() {
    try {
      await downloadFile('/reports/bookings.csv', 'bookings-report.csv');
      setToast('Bookings report export started.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading && !data) return <LoadingState rows={9} />;
  if (error && !data) return <ErrorState message={error} onRetry={() => loadDashboard()} />;

  const kpis = data?.kpis || {};
  const tables = data?.tables || { recentBookings: [], pendingDocuments: [], delayedShipments: [], pendingPayments: [] };
  const operations = today.operations || {};
  const completionRate = kpis.totalBookings ? Math.round((Number(kpis.completedShipments || 0) / Number(kpis.totalBookings || 1)) * 100) : 0;
  const delayedRate = kpis.totalBookings ? Math.round((Number(kpis.delayedShipments || 0) / Number(kpis.totalBookings || 1)) * 100) : 0;

  return (
    <div className="space-y-4">
      <Toast message={toast} onClose={() => setToast('')} />
      <h2 className="sr-only">ORBEM Solutions operations performance dashboard with KPIs, revenue, shipment status, recent bookings, and alerts</h2>
      <PageHeader
        title="Operations Dashboard"
        description="Live command view for bookings, shipments, documents, revenue, delays, and operations follow-ups."
        statusText="Live operations"
      />

      <FilterPanel
        filters={filters}
        owners={data?.owners || []}
        updateFilter={updateFilter}
        navigate={navigate}
        exportReport={exportReport}
        originQuery={originQuery}
        destinationQuery={destinationQuery}
        onOriginChange={updateOriginQuery}
        onDestinationChange={updateDestinationQuery}
        onOriginLocationSelect={selectOriginLocation}
        onDestinationLocationSelect={selectDestinationLocation}
        onApplyFilters={applyFilters}
        onClearFilters={clearFiltersAndLocations}
      />

      {error ? <ErrorState message={error} onRetry={() => loadDashboard()} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total bookings" value={formatNumber(kpis.totalBookings, 0)} icon={PackageCheck} tone="green" progress={Math.max(completionRate, 10)}>
          <Pill tone="green" icon={CheckCircle2}>{completionRate}% complete</Pill>
          shipment coverage
        </KpiCard>
        <KpiCard label="Revenue collected" value={formatCurrency(kpis.totalRevenue)} icon={Receipt} tone="blue" progress={78}>
          <Pill tone="blue">Live</Pill>
          from paid invoices
        </KpiCard>
        <KpiCard label="Delayed shipments" value={formatNumber(kpis.delayedShipments, 0)} icon={AlertCircle} tone="red" progress={Math.max(delayedRate, kpis.delayedShipments ? 12 : 4)}>
          <Pill tone={kpis.delayedShipments ? 'red' : 'green'}>{formatNumber(delayedRate, 0)}%</Pill>
          of bookings
        </KpiCard>
        <KpiCard label="Pending documents" value={formatNumber(kpis.pendingDocuments, 0)} icon={FileWarning} tone="amber" progress={Math.min(Number(kpis.pendingDocuments || 0) * 8, 100)}>
          <Pill tone={kpis.pendingDocuments ? 'amber' : 'green'}>{formatNumber(operations.documentsPendingToday, 0)} due today</Pill>
          action needed
        </KpiCard>
      </div>

      <OperationsStrip operations={operations} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
        <RevenueChart data={charts.revenue} onExport={exportReport} />
        <StatusBreakdown rows={charts.statuses} operations={operations} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <RecentBookings rows={tables.recentBookings || []} />
        <AlertCenter tables={tables} activity={activity} runningAlert={runningAlert} onRunAlertCheck={runAlertCheck} />
      </div>
    </div>
  );
}
