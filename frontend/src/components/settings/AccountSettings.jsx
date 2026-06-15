import { Calendar, Mail, Phone, Shield, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import SettingsRow from './SettingsRow';
import { formatDate } from '../../utils/formatters';

export default function AccountSettings({ user, settings }) {
  const navigate = useNavigate();
  const profile = settings.profile || {};
  const rows = [
    ['Name', user?.name || '-'],
    ['Email', user?.email || '-'],
    ['Phone number', user?.phone || '-'],
    ['Role', user?.role || '-'],
    ['Department', profile.department || '-'],
    ['Designation', profile.designation || '-'],
    ['Account status', user?.is_active === 0 ? 'Inactive' : 'Active'],
    ['Joined date', formatDate(user?.created_at)]
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Account</h1>
        <p className="mt-1 text-sm text-gray-500">Your ORBEM staff identity and dashboard access details.</p>
      </div>
      <div className="rounded-lg border border-[#dbe3ea] bg-white p-5 shadow-card">
        <SettingsRow icon={UserRound} title="Account information" description="Information shown inside the operations dashboard.">
          <dl className="grid gap-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#dbe3ea] bg-[#f8fafc] px-3 py-2">
                <dt className="text-xs font-semibold text-[#64748b]">{label}</dt>
                <dd className="mt-1 truncate text-sm font-semibold text-[#172033]">{value}</dd>
              </div>
            ))}
          </dl>
        </SettingsRow>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf2f7] pt-4">
          <Button icon={UserRound} onClick={() => navigate('/profile')}>Edit profile</Button>
          <Button variant="secondary" icon={Mail} onClick={() => window.location.href = `mailto:${user?.email || ''}`}>Email account</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#dbe3ea] bg-white p-4 shadow-card">
          <Shield className="h-5 w-5 text-brand-600" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Role</p>
          <p className="mt-1 text-sm text-gray-500">{user?.role || 'Operations Staff'}</p>
        </div>
        <div className="rounded-lg border border-[#dbe3ea] bg-white p-4 shadow-card">
          <Phone className="h-5 w-5 text-brand-600" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Phone</p>
          <p className="mt-1 text-sm text-gray-500">{user?.phone || 'Not added'}</p>
        </div>
        <div className="rounded-lg border border-[#dbe3ea] bg-white p-4 shadow-card">
          <Calendar className="h-5 w-5 text-brand-600" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Joined</p>
          <p className="mt-1 text-sm text-gray-500">{formatDate(user?.created_at)}</p>
        </div>
      </div>
    </div>
  );
}
