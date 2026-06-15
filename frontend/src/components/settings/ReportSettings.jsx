import { CalendarDays, FileSpreadsheet, Printer } from 'lucide-react';
import Select from '../common/Select';
import SettingsRow from './SettingsRow';
import ToggleSwitch from './ToggleSwitch';

const toggles = [
  ['reports.includeCompanyHeader', Printer, 'Include company header', 'Show ORBEM Solutions header in printable and exported reports.'],
  ['reports.includeGeneratedDate', CalendarDays, 'Include generated date', 'Add generated date to report views.'],
  ['reports.includeFiltersSummary', FileSpreadsheet, 'Include filters summary', 'Show selected filters in report output.'],
  ['reports.monthlyReminder', CalendarDays, 'Monthly report reminder', 'Remind you to review monthly operations reports.']
];

export default function ReportSettings({ settings, onSettingChange, savingKey }) {
  const reports = settings.reports;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Reports & Export</h1>
        <p className="mt-1 text-sm text-gray-500">Defaults for operational reports and exports.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <SettingsRow icon={FileSpreadsheet} title="Report defaults" description="Used when creating exports or printable report views.">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Default report format"
              value={reports.defaultFormat}
              onChange={(event) => onSettingChange('reports.defaultFormat', event.target.value)}
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'pdf-ready', label: 'PDF-ready print' }
              ]}
            />
            <Select
              label="Default date range"
              value={reports.defaultDateRange}
              onChange={(event) => onSettingChange('reports.defaultDateRange', event.target.value)}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'this_week', label: 'This week' },
                { value: 'this_month', label: 'This month' },
                { value: 'custom', label: 'Custom' }
              ]}
            />
          </div>
        </SettingsRow>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="divide-y divide-gray-100">
          {toggles.map(([key, Icon, title, description]) => {
            const field = key.split('.')[1];
            return (
              <SettingsRow
                key={key}
                icon={Icon}
                title={title}
                description={description}
                control={<ToggleSwitch checked={Boolean(reports[field])} disabled={savingKey === key} onChange={(value) => onSettingChange(key, value)} label={title} />}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
