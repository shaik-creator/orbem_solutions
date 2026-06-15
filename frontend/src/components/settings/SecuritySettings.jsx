import { BellRing, KeyRound, Laptop, LogOut, ShieldCheck, ShieldPlus } from 'lucide-react';
import Button from '../common/Button';
import SettingsRow from './SettingsRow';
import ToggleSwitch from './ToggleSwitch';
import { formatDate } from '../../utils/formatters';

const securityToggles = [
  ['security.twoFactor', ShieldPlus, 'Two-factor authentication', 'Require a second verification step for sensitive account access.'],
  ['security.loginAlerts', BellRing, 'Login alerts', 'Notify you when your account is used from a new browser or device.'],
  ['security.deviceHistory', Laptop, 'Device history', 'Keep recent device context visible in this account center.']
];

export default function SecuritySettings({ user, settings, security, onLogout, onComingSoon, onSettingChange, savingKey }) {
  const securitySettings = settings?.security || {};
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Security</h1>
        <p className="mt-1 text-sm text-gray-500">Account access, current device, and security activity.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500">Last login time</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(security?.lastLoginAt)}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500">Account role</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{security?.accountRole || user?.role || '-'}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 md:col-span-2">
            <p className="text-xs font-medium text-gray-500">Current browser/device</p>
            <p className="mt-1 break-words text-sm font-semibold text-gray-900">{security?.currentDevice || 'Current browser'}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500">Password updated</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(security?.passwordUpdatedAt)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="divide-y divide-gray-100">
          {securityToggles.map(([key, Icon, title, description]) => {
            const field = key.split('.')[1];
            return (
              <SettingsRow
                key={key}
                icon={Icon}
                title={title}
                description={description}
                control={
                  <ToggleSwitch
                    checked={Boolean(securitySettings[field])}
                    disabled={savingKey === key}
                    onChange={(value) => onSettingChange?.(key, value)}
                    label={title}
                  />
                }
              />
            );
          })}
          <SettingsRow icon={KeyRound} title="Change password" description="Password change flow can be connected to a dedicated backend endpoint.">
            <Button variant="secondary" onClick={() => onComingSoon('Change password')}>Change password</Button>
          </SettingsRow>
          <SettingsRow icon={Laptop} title="Active sessions" description="Current session is shown; full session revocation can be added later.">
            <div className="space-y-2">
              {(security?.activeSessions || []).map((session) => (
                <div key={session.id} className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                  <p className="font-semibold text-gray-900">{session.label}</p>
                  <p className="mt-1 break-words text-gray-500">{session.browser}</p>
                </div>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow icon={ShieldCheck} title="Login activity" description="Recent account access information.">
            <div className="space-y-2">
              {(security?.loginActivity || []).length ? security.loginActivity.map((activity) => (
                <div key={activity.id} className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                  <p className="font-semibold text-gray-900">{activity.label}</p>
                  <p className="mt-1 text-gray-500">{formatDate(activity.created_at)}</p>
                </div>
              )) : <p className="text-sm text-gray-500">No login activity is available yet.</p>}
            </div>
          </SettingsRow>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <Button variant="danger" icon={LogOut} onClick={onLogout}>Logout from this device</Button>
          <Button variant="secondary" onClick={() => onComingSoon('Logout from all devices')}>Logout from all devices</Button>
        </div>
      </div>
    </div>
  );
}
