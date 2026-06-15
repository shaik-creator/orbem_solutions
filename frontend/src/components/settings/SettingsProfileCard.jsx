import { Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function initials(name) {
  return String(name || 'ORBEM User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function SettingsProfileCard({ user, profile }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      className="mb-3 flex w-full items-center gap-3 rounded-lg border border-[#dbe3ea] bg-white p-5 text-left shadow-card transition hover:border-brand-500"
    >
      {profile?.avatarUrl ? (
        <img src={profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1d9e75] to-[#2563eb] text-sm font-bold text-white">
          {initials(user?.name)}
        </div>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#172033]">{user?.name || 'Operations user'}</span>
        <span className="mt-0.5 block truncate text-xs text-[#64748b]">{user?.role || 'Team member'}</span>
        <span className="mt-0.5 block truncate text-xs text-[#64748b]">{user?.email || 'No email available'}</span>
      </span>
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748b]">
        <Edit3 className="h-4 w-4" />
      </span>
    </button>
  );
}
