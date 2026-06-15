import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import PageHeader from '../components/common/PageHeader';
import PriorityBadge from '../components/common/PriorityBadge';
import Select from '../components/common/Select';
import StatusBadge from '../components/bookings/StatusBadge';
import Toast from '../components/common/Toast';
import { formatDate } from '../utils/formatters';

const columns = ['To Do', 'In Progress', 'Waiting', 'Completed'];
const emptyTask = { title: '', description: '', priority: 'Normal', status: 'To Do', due_date: '', assigned_to: '', related_booking_id: '' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [owners, setOwners] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const [taskRes, summaryRes, bookingRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/dashboard/summary'),
        api.get('/bookings')
      ]);
      setTasks(taskRes.data.tasks || []);
      setOwners(summaryRes.data.owners || []);
      setBookings((bookingRes.data.bookings || []).slice(0, 40));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function createTask(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/tasks', {
        ...form,
        assigned_to: form.assigned_to || null,
        related_booking_id: form.related_booking_id || null,
        due_date: form.due_date || null
      });
      setCreating(false);
      setForm(emptyTask);
      setToast('Task created.');
      await loadTasks();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function moveTask(task, status) {
    try {
      await api.put(`/tasks/${task.id}/status`, { status });
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status } : item)));
      setToast(`Task moved to ${status}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <Toast message={toast} onClose={() => setToast('')} />
      <PageHeader
        title="Staff Task Board"
        description="Kanban-style follow-up tasks for operations, accounts, documentation, and warehouse teams."
        actions={<><Button variant="secondary" icon={RefreshCw} onClick={loadTasks}>Refresh</Button><Button icon={Plus} onClick={() => setCreating(true)}>New task</Button></>}
      />
      {error ? <ErrorState message={error} onRetry={loadTasks} /> : null}
      {loading ? (
        <LoadingState rows={8} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {columns.map((column) => {
            const rows = tasks.filter((task) => task.status === column);
            return (
              <section key={column} className="rounded-lg border border-gray-200 bg-white p-3 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">{column}</h2>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{rows.length}</span>
                </div>
                <div className="space-y-3">
                  {rows.map((task) => (
                    <article key={task.id} className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.description ? <p className="mt-2 text-gray-600">{task.description}</p> : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {task.booking_id ? <span>{task.booking_id}</span> : null}
                        <span>Due {formatDate(task.due_date)}</span>
                        <span>{task.assigned_to_name || 'Unassigned'}</span>
                      </div>
                      <Select className="mt-3" value={task.status} options={columns} onChange={(event) => moveTask(task, event.target.value)} />
                    </article>
                  ))}
                  {!rows.length ? <EmptyState title="No tasks" message={`No items in ${column}.`} /> : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Modal title="New task" open={creating} onClose={() => setCreating(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={createTask}>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Select label="Priority" value={form.priority} options={['Low', 'Normal', 'High', 'Critical']} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          <Select label="Status" value={form.status} options={columns} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <Input type="date" label="Due date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Select label="Assigned to" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
            <option value="">Unassigned</option>
            {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
          </Select>
          <Select label="Related booking" value={form.related_booking_id} onChange={(e) => setForm({ ...form, related_booking_id: e.target.value })}>
            <option value="">None</option>
            {bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.booking_id} - {booking.customer_name}</option>)}
          </Select>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Description</span>
            <textarea className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="flex justify-end md:col-span-2"><Button type="submit" loading={saving}>Save task</Button></div>
        </form>
      </Modal>
    </div>
  );
}
