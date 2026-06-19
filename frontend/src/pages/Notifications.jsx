import { useEffect, useState } from 'react';
import { Check, ClipboardPlus, Eye, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/bookings/StatusBadge';
import Toast from '../components/common/Toast';
import { formatDate } from '../utils/formatters';

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isThisWeek(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function AlertCard({ notification, onRead, onDismiss, onAssign }) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-card ${notification.is_read ? 'border-gray-200' : 'border-brand-300'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
            <StatusBadge status={notification.severity} />
            <StatusBadge status={notification.type} />
          </div>
          <p className="mt-2 text-sm text-gray-600">{notification.message}</p>
          <p className="mt-2 text-xs text-gray-500">
            {notification.booking_id ? `${notification.booking_id} - ` : ''}{formatDate(notification.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {notification.related_booking_id ? (
            <Link to={`/bookings/${notification.related_booking_id}`}>
              <Button variant="secondary" icon={Eye}>View booking</Button>
            </Link>
          ) : null}
          {!notification.is_read ? <Button variant="secondary" icon={Check} onClick={() => onRead(notification)}>Mark read</Button> : null}
          <Button variant="secondary" icon={ClipboardPlus} onClick={() => onAssign(notification)}>Assign task</Button>
          <Button variant="ghost" icon={Trash2} onClick={() => onDismiss(notification)}>Dismiss</Button>
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadNotifications() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function refreshNotifications() {
      loadNotifications();
    }
    window.addEventListener('orbem:refresh-notifications', refreshNotifications);
    return () => window.removeEventListener('orbem:refresh-notifications', refreshNotifications);
  }, []);

  async function markRead(notification) {
    try {
      await api.put(`/notifications/${notification.id}/read`);
      setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: 1 } : item)));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function dismiss(notification) {
    try {
      await api.put(`/notifications/${notification.id}/dismiss`);
      setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: 1 } : item)));
      setToast('Notification dismissed.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function assignTask(notification) {
    try {
      await api.post(`/notifications/${notification.id}/assign-task`, {});
      setToast('Task assigned from alert.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function runAlerts() {
    setRunning(true);
    setError('');
    setToast('');
    try {
      const response = await api.post('/notifications/run-alert-check');
      setToast(response.data.message);
      await loadNotifications();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  }

  const groups = [
    ['Critical', notifications.filter((item) => item.severity === 'Critical' && !item.is_read)],
    ['Today', notifications.filter((item) => isToday(item.created_at) && !item.is_read)],
    ['This Week', notifications.filter((item) => isThisWeek(item.created_at) && !item.is_read)],
    ['Resolved', notifications.filter((item) => item.is_read)]
  ];

  return (
    <div className="space-y-6">
      <Toast message={toast} onClose={() => setToast('')} />
      <PageHeader
        title="Smart Alert Center"
        description="Critical alerts, today's follow-ups, weekly reminders, and resolved notices."
        actions={<><Button variant="secondary" icon={RefreshCw} onClick={loadNotifications}>Refresh</Button><Button icon={ShieldAlert} loading={running} onClick={runAlerts}>Run alert check</Button></>}
      />

      {error ? <ErrorState message={error} onRetry={loadNotifications} /> : null}

      {loading ? (
        <LoadingState rows={7} />
      ) : notifications.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {groups.map(([title, rows]) => (
            <section key={title} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{rows.length}</span>
              </div>
              {rows.length ? rows.map((notification) => (
                <AlertCard key={`${title}-${notification.id}`} notification={notification} onRead={markRead} onDismiss={dismiss} onAssign={assignTask} />
              )) : <EmptyState title={`No ${title.toLowerCase()} alerts`} message="Nothing needs attention in this section." />}
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="No notifications" message="Alerts created by the system will appear here." />
      )}
    </div>
  );
}
