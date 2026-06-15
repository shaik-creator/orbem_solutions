import { Bell, CalendarClock, Clock, CreditCard, FileWarning, PackagePlus, RefreshCw, Ship, Sparkles } from 'lucide-react';
import Select from '../common/Select';
import Input from '../common/Input';
import SettingsRow from './SettingsRow';
import ToggleSwitch from './ToggleSwitch';

const toggleRows = [
  ['notifications.shipmentDelay', Ship, 'Shipment delay alerts', 'Immediate alerts when shipment dates or statuses need attention.'],
  ['notifications.pendingDocuments', FileWarning, 'Pending document alerts', 'Reminders for missing, pending, or rejected documents.'],
  ['notifications.paymentOverdue', CreditCard, 'Payment overdue alerts', 'Critical follow-up for overdue or unpaid invoices.'],
  ['notifications.bookingCreated', PackagePlus, 'Booking created alerts', 'Notify you when new bookings enter the workflow.'],
  ['notifications.statusUpdate', RefreshCw, 'Booking status update alerts', 'Notify on important shipment milestone changes.'],
  ['notifications.dailySummary', CalendarClock, 'Daily operations summary', 'Morning snapshot of delayed shipments, documents, and payments.'],
  ['notifications.weeklyRevenue', CreditCard, 'Weekly revenue summary', 'Weekly view of invoice, received, and pending balances.'],
  ['notifications.aiSuggestions', Sparkles, 'AI assistant suggestions', 'Suggestions from ORBEM Ops Assistant when useful.'],
  ['notifications.email', Bell, 'Email notifications', 'Send selected operations alerts to your email.'],
  ['notifications.inApp', Bell, 'In-app notifications', 'Show notifications inside the dashboard.'],
  ['notifications.browserPush', Bell, 'Push / browser alerts', 'Allow browser-level alerts for urgent operations items.']
];

export default function NotificationSettings({ settings, onSettingChange, savingKey }) {
  const notifications = settings.notifications;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">Choose which operations events deserve your attention.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="divide-y divide-gray-100">
          {toggleRows.map(([key, Icon, title, description]) => {
            const [, field] = key.split('.');
            return (
              <SettingsRow
                key={key}
                icon={Icon}
                title={title}
                description={description}
                control={<ToggleSwitch checked={Boolean(notifications[field])} disabled={savingKey === key} onChange={(value) => onSettingChange(key, value)} label={title} />}
              />
            );
          })}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <SettingsRow icon={Clock} title="Notification timing" description="Quiet hours and reminder windows for summary alerts.">
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="time" label="Morning summary time" value={notifications.morningSummaryTime} onChange={(event) => onSettingChange('notifications.morningSummaryTime', event.target.value)} />
            <Select
              label="Reminder before deadline"
              value={notifications.reminderBeforeDeadline}
              onChange={(event) => onSettingChange('notifications.reminderBeforeDeadline', event.target.value)}
              options={['1 hour', '3 hours', '6 hours', '1 day', '2 days']}
            />
            <Input type="time" label="Quiet hours start" value={notifications.quietHoursStart} onChange={(event) => onSettingChange('notifications.quietHoursStart', event.target.value)} />
            <Input type="time" label="Quiet hours end" value={notifications.quietHoursEnd} onChange={(event) => onSettingChange('notifications.quietHoursEnd', event.target.value)} />
          </div>
        </SettingsRow>
      </div>
    </div>
  );
}
