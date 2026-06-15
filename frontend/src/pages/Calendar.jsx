import { useEffect, useState } from 'react';
import { CalendarDays, CreditCard, FileText, PackageCheck, RefreshCw, Truck } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/bookings/StatusBadge';
import { formatDate } from '../utils/formatters';

const icons = {
  Delivery: PackageCheck,
  Payment: CreditCard,
  Document: FileText,
  Pickup: Truck,
  Dispatch: Truck,
  General: CalendarDays
};

function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState({ from: addDays(0), to: addDays(7) });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadEvents(nextRange = range) {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/calendar/events', { params: nextRange });
      setEvents(response.data.events || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const grouped = events.reduce((acc, event) => {
    const key = String(event.event_date || '').slice(0, 10);
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendar"
        description="Weekly operations view for deliveries, payment due dates, pickups, dispatches, and document deadlines."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={() => loadEvents()}>Refresh</Button>}
      />
      <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-card md:grid-cols-[1fr_1fr_auto]">
        <Input type="date" label="From" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <Input type="date" label="To" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        <div className="flex items-end"><Button onClick={() => loadEvents()}>Apply</Button></div>
      </div>
      {error ? <ErrorState message={error} onRetry={() => loadEvents()} /> : null}
      {loading ? (
        <LoadingState rows={7} />
      ) : events.length ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, rows]) => (
            <section key={date} className="rounded-lg border border-gray-200 bg-white shadow-card">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">{formatDate(date)}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {rows.map((event, index) => {
                  const Icon = icons[event.event_type] || CalendarDays;
                  return (
                    <div key={`${event.event_type}-${event.related_id}-${index}`} className="flex items-start gap-3 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-brand-700"><Icon className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{event.event_type} {event.event_time ? `- ${event.event_time}` : ''}</p>
                      </div>
                      <StatusBadge status={event.status || event.event_type} />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="No calendar events" message="No deliveries, payments, pickups, or custom events found for this date range." />
      )}
    </div>
  );
}
