import { Check, LayoutDashboard, Monitor, Palette, Rows3, Sidebar } from 'lucide-react';
import SettingsRow from './SettingsRow';
import { classNames } from '../../utils/formatters';

const groups = [
  ['appearance.theme', Monitor, 'Theme', 'Pick the dashboard theme.', ['light', 'dark', 'system']],
  ['appearance.sidebarMode', Sidebar, 'Sidebar mode', 'Choose navigation width.', ['expanded', 'compact']],
  ['appearance.density', Rows3, 'Density', 'Control page spacing.', ['comfortable', 'compact']],
  ['appearance.tableRowSize', Rows3, 'Table row size', 'Set table scanning density.', ['small', 'medium', 'large']],
  ['appearance.dashboardCardStyle', LayoutDashboard, 'Dashboard card style', 'Choose KPI card detail level.', ['simple', 'detailed']],
  ['appearance.cardRadius', LayoutDashboard, 'Card radius style', 'Tune how soft dashboard cards and panels feel.', ['compact', 'rounded', 'large']],
  ['appearance.fontSize', Rows3, 'Font size preference', 'Adjust base reading scale for account and dashboard screens.', ['small', 'medium', 'large']]
];

const accents = [
  ['blue', 'bg-blue-600'],
  ['green', 'bg-emerald-600'],
  ['purple', 'bg-violet-600'],
  ['orange', 'bg-amber-600'],
  ['slate', 'bg-slate-600']
];

function label(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AppearanceSettings({ settings, onSettingChange, savingKey }) {
  const appearance = settings.appearance;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Appearance</h1>
        <p className="mt-1 text-sm text-gray-500">Local display preferences apply immediately and persist after refresh.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="divide-y divide-gray-100">
          {groups.map(([key, Icon, title, description, options]) => {
            const field = key.split('.')[1];
            return (
              <SettingsRow key={key} icon={Icon} title={title} description={description}>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={savingKey === key}
                      onClick={() => onSettingChange(key, option)}
                      className={classNames(
                        'rounded-md border px-3 py-2 text-sm font-medium transition disabled:opacity-60',
                        appearance[field] === option ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {label(option)}
                    </button>
                  ))}
                </div>
              </SettingsRow>
            );
          })}
          <SettingsRow icon={Palette} title="Accent color" description="Used for key actions and selected states.">
            <div className="flex flex-wrap gap-2">
              {accents.map(([name, colorClass]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSettingChange('appearance.accentColor', name)}
                  className={classNames('flex h-10 w-10 items-center justify-center rounded-md border border-gray-300', colorClass)}
                  aria-label={`${name} accent`}
                >
                  {appearance.accentColor === name ? <Check className="h-5 w-5 text-white" /> : null}
                </button>
              ))}
            </div>
          </SettingsRow>
        </div>
      </div>
    </div>
  );
}
