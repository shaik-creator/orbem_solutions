import { Eye, History, Mail, Phone, Radio, Sparkles } from 'lucide-react';
import SettingsRow from './SettingsRow';
import ToggleSwitch from './ToggleSwitch';

const rows = [
  ['privacy.showEmail', Mail, 'Show email to team members', 'Allow other dashboard users to see your email in staff context.'],
  ['privacy.showPhone', Phone, 'Show phone number to team members', 'Useful for urgent shipment coordination and handovers.'],
  ['privacy.showOnlineStatus', Radio, 'Show online status', 'Display whether you are currently active in the dashboard.'],
  ['privacy.showLastActive', Eye, 'Show last active time', 'Let teammates know when you last used the operations dashboard.'],
  ['privacy.allowTaskHistory', History, 'Allow staff to view assigned task history', 'Shows your assignment history where it helps operations continuity.'],
  ['privacy.allowAssistantActivity', Sparkles, 'Allow assistant to use dashboard activity', 'Lets ORBEM Ops Assistant use your activity for better suggestions.']
];

export default function PrivacySettings({ settings, onSettingChange, savingKey }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Privacy</h1>
        <p className="mt-1 text-sm text-gray-500">Control what your team and assistant can use for collaboration.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="divide-y divide-gray-100">
          {rows.map(([key, Icon, title, description]) => {
            const [, field] = key.split('.');
            return (
              <SettingsRow
                key={key}
                icon={Icon}
                title={title}
                description={description}
                control={<ToggleSwitch checked={Boolean(settings.privacy[field])} disabled={savingKey === key} onChange={(value) => onSettingChange(key, value)} label={title} />}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
