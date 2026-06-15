import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  Camera,
  CheckCircle2,
  CircleHelp,
  FileSpreadsheet,
  Info,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Palette,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  UsersRound,
  X
} from 'lucide-react';
import Button from '../components/common/Button';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';
import Toast from '../components/common/Toast';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import AssistantSettings from '../components/settings/AssistantSettings';
import DataStorageSettings from '../components/settings/DataStorageSettings';
import HelpSupportSettings from '../components/settings/HelpSupportSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import PrivacySettings from '../components/settings/PrivacySettings';
import ReportSettings from '../components/settings/ReportSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import SettingsRow from '../components/settings/SettingsRow';
import {
  buildAccountDataDownload,
  defaultSettings,
  settingsService,
  storeAppearanceSettings
} from '../services/settingsService';
import { downloadFile, getErrorMessage } from '../services/api';
import { supportService } from '../services/supportService';
import { useAuth } from '../services/authService';
import { classNames, formatDate } from '../utils/formatters';

const COMPANY_NAME = 'ORBEM SOLUTIONS PRIVATE LIMITED';

const sectionItems = [
  { key: 'editProfile', title: 'Edit Profile', subtitle: 'Photo, name, phone, status', icon: UserRound },
  { key: 'personal', title: 'Personal Information', subtitle: 'Identity and staff details', icon: Mail },
  { key: 'login', title: 'Account & Login', subtitle: 'Email login and access role', icon: KeyRound },
  { key: 'security', title: 'Password & Security', subtitle: '2FA, sessions, devices', icon: ShieldCheck },
  { key: 'notifications', title: 'Notifications', subtitle: 'Email, push, shipment alerts', icon: Bell },
  { key: 'privacy', title: 'Privacy & Permissions', subtitle: 'Team and assistant visibility', icon: Shield },
  { key: 'appearance', title: 'Appearance', subtitle: 'Theme, density, sidebar, color', icon: Palette },
  { key: 'assistant', title: 'Assistant Preferences', subtitle: 'Tone and context controls', icon: Bot },
  { key: 'team', title: 'Team / Workspace', subtitle: 'Role and workspace context', icon: UsersRound },
  { key: 'exports', title: 'Export & Reports', subtitle: 'CSV and report defaults', icon: FileSpreadsheet },
  { key: 'support', title: 'Help & Support', subtitle: 'FAQ, support, issue reporting', icon: CircleHelp },
  { key: 'about', title: 'About ORBEM', subtitle: 'Version, stack, project note', icon: Info }
];

function initials(name) {
  return String(name || 'Ops User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function setDeepValue(source, key, value) {
  const next = JSON.parse(JSON.stringify(source));
  const parts = key.split('.');
  let current = next;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current[parts[index]] = current[parts[index]] || {};
    current = current[parts[index]];
  }
  current[parts[parts.length - 1]] = value;
  return next;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getStorageInfo() {
  const keys = Object.keys(localStorage);
  return {
    reportExports: Number(localStorage.getItem('orbem_report_exports_count') || 0),
    cachedDashboardData: keys.filter((key) => /cache|dashboard/i.test(key)).length
  };
}

function Avatar({ name, avatarUrl, size = 'h-20 w-20', className = '' }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={classNames(size, 'rounded-full object-cover ring-4 ring-white shadow-lg', className)} />;
  }

  return (
    <span className={classNames(size, 'flex items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] via-[#2563eb] to-[#0f1f3d] text-xl font-black text-white ring-4 ring-white shadow-lg', className)}>
      {initials(name)}
    </span>
  );
}

function ProfileSummaryCard({ user, profile, onEdit, onChangePhoto, onSecurity }) {
  const status = user?.status_message || 'Available for operations';
  const location = profile?.department || 'Operations workspace';

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#dbe3ea] bg-white shadow-[0_18px_50px_rgba(15,31,61,0.10)]">
      <div className="h-24 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.55),transparent_35%),linear-gradient(135deg,#102a55,#0b1730_55%,#0f766e)]" />
      <div className="-mt-11 px-5 pb-5">
        <div className="flex items-end justify-between gap-3">
          <Avatar name={user?.name} avatarUrl={profile?.avatarUrl} size="h-24 w-24" />
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {user?.role || 'Operations'}
          </span>
        </div>

        <div className="mt-4 min-w-0">
          <h2 className="truncate text-xl font-bold text-[#0f1f3d]">{user?.name || 'Ops User'}</h2>
          <p className="mt-1 truncate text-sm font-medium text-[#64748b]">{profile?.designation || user?.role || 'Operations Staff'}</p>
        </div>

        <div className="mt-4 space-y-2 text-sm text-[#344054]">
          <p className="flex min-w-0 items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-[#2563eb]" />
            <span className="truncate">{COMPANY_NAME}</span>
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-[#2563eb]" />
            <span className="truncate">{user?.email || 'No email added'}</span>
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-[#2563eb]" />
            <span className="truncate">{user?.phone || 'No phone added'}</span>
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-[#2563eb]" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-[#dbe3ea] bg-[#f8fafc] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#64748b]">Status</p>
          <p className="mt-1 text-sm font-semibold text-[#172033]">{status}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['Access', user?.role || 'Staff'],
            ['Workspace', 'Team'],
            ['Account', user?.is_active === 0 ? 'Inactive' : 'Active']
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#dbe3ea] bg-white px-2 py-3">
              <p className="truncate text-xs font-semibold text-[#64748b]">{label}</p>
              <p className="mt-1 truncate text-sm font-bold text-[#0f1f3d]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <Button icon={UserRound} onClick={onEdit}>Edit profile</Button>
          <Button variant="secondary" icon={Camera} onClick={onChangePhoto}>Change photo</Button>
          <Button variant="secondary" icon={ShieldCheck} onClick={onSecurity}>Security</Button>
        </div>
      </div>
    </section>
  );
}

function SettingsSectionNav({ items, activeKey, onSelect }) {
  return (
    <nav className="rounded-[24px] border border-[#dbe3ea] bg-white p-2 shadow-[0_16px_38px_rgba(15,31,61,0.08)]" aria-label="Account center sections">
      <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={classNames(
                'group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition duration-200',
                active ? 'bg-[#eaf3ff] text-[#0f1f3d] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.16)]' : 'text-[#64748b] hover:bg-[#f5f7fb] hover:text-[#172033]'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className={classNames('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition', active ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-500/20' : 'bg-[#eef2f7] text-[#64748b] group-hover:bg-white group-hover:text-[#2563eb]')}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{item.title}</span>
                <span className="mt-0.5 block truncate text-xs text-[#64748b]">{item.subtitle}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function EditProfileForm({ user, settings, onSave, saving, onDirtyChange, onCancelSaved }) {
  const inputRef = useRef(null);
  const profile = settings.profile || {};
  const initialDraft = useMemo(
    () => ({
      name: user?.name || '',
      displayName: profile.designation || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || '',
      company: COMPANY_NAME,
      location: profile.department || '',
      statusMessage: user?.status_message || '',
      bio: profile.bio || '',
      avatarUrl: profile.avatarUrl || ''
    }),
    [profile.avatarUrl, profile.bio, profile.department, profile.designation, user?.email, user?.name, user?.phone, user?.role, user?.status_message]
  );
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(draft) !== JSON.stringify(initialDraft));
  }, [draft, initialDraft, onDirtyChange]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('avatarUrl', reader.result);
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    const saved = await onSave({
      name: draft.name,
      phone: draft.phone,
      status_message: draft.statusMessage,
      bio: draft.bio,
      department: draft.location,
      designation: draft.displayName,
      avatarUrl: draft.avatarUrl
    });
    if (saved) onDirtyChange?.(false);
  }

  function cancel() {
    setDraft(initialDraft);
    onDirtyChange?.(false);
    onCancelSaved?.();
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Edit Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Business profile controls with an account-page feel, tuned for ORBEM operations.</p>
      </div>

      <section className="rounded-[24px] border border-[#dbe3ea] bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={draft.name} avatarUrl={draft.avatarUrl} size="h-24 w-24" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-[#0f1f3d]">{draft.name || 'Profile photo'}</h2>
            <p className="mt-1 text-sm text-[#64748b]">Upload a clear staff photo, or keep initials for a clean account avatar.</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={choosePhoto} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" icon={UploadCloud} onClick={() => inputRef.current?.click()}>Change photo</Button>
              <Button variant="ghost" icon={Trash2} onClick={() => update('avatarUrl', '')}>Remove photo</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#dbe3ea] bg-white p-5 shadow-card">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Full Name" value={draft.name} onChange={(event) => update('name', event.target.value)} required />
          <Input label="Display Name" value={draft.displayName} onChange={(event) => update('displayName', event.target.value)} placeholder="Operations lead, documentation owner..." />
          <Input label="Email" value={draft.email} readOnly className="opacity-85" />
          <Input label="Phone Number" value={draft.phone} onChange={(event) => update('phone', event.target.value)} />
          <Input label="Role" value={draft.role} readOnly className="opacity-85" />
          <Input label="Company Name" value={draft.company} readOnly className="opacity-85" />
          <Input label="Location" value={draft.location} onChange={(event) => update('location', event.target.value)} placeholder="Hyderabad operations, warehouse, accounts..." />
          <Input label="Status" value={draft.statusMessage} onChange={(event) => update('statusMessage', event.target.value)} placeholder="Available, busy with operations..." />
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-semibold text-[#344054]">Bio / About</span>
            <textarea
              className="min-h-28 w-full rounded-lg border border-[#dbe3ea] bg-white px-3 py-2 text-sm text-[#172033] shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value={draft.bio}
              onChange={(event) => update('bio', event.target.value)}
              placeholder="Short internal note for team context."
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" icon={X} onClick={cancel}>Cancel</Button>
          <Button type="submit" icon={Save} loading={saving}>Save changes</Button>
        </div>
      </section>
    </form>
  );
}

function PersonalInformationPanel({ user, settings, onEdit }) {
  const profile = settings.profile || {};
  const rows = [
    ['Full name', user?.name || '-'],
    ['Display name', profile.designation || '-'],
    ['Email', user?.email || '-'],
    ['Phone', user?.phone || '-'],
    ['Role', user?.role || '-'],
    ['Company', COMPANY_NAME],
    ['Location', profile.department || '-'],
    ['Joined', formatDate(user?.created_at)]
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Personal Information</h1>
        <p className="mt-1 text-sm text-gray-500">A clean view of your ORBEM staff identity and business contact details.</p>
      </div>
      <section className="rounded-[24px] border border-[#dbe3ea] bg-white p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#dbe3ea] bg-[#f8fafc] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
              <p className="mt-1 truncate text-sm font-bold text-[#172033]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-[#edf2f7] pt-4">
          <Button icon={UserRound} onClick={onEdit}>Edit profile details</Button>
        </div>
      </section>
      <section className="rounded-[24px] border border-[#dbe3ea] bg-white p-5 shadow-card">
        <SettingsRow icon={Building2} title="Workspace profile" description={profile.bio || 'Add a short team-facing note so staff understand your role in daily operations.'} />
      </section>
    </div>
  );
}

function AccountLoginPanel({ user, security, onLogout }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Account & Login</h1>
        <p className="mt-1 text-sm text-gray-500">Login identity, role context, and account access status.</p>
      </div>
      <section className="rounded-[24px] border border-[#dbe3ea] bg-white p-5 shadow-card">
        <div className="divide-y divide-gray-100">
          <SettingsRow icon={Mail} title="Username / Email login" description={user?.email || 'No login email found.'}>
            <p className="rounded-2xl border border-[#dbe3ea] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#172033]">{user?.email || '-'}</p>
          </SettingsRow>
          <SettingsRow icon={ShieldCheck} title="Account role" description="Role controls dashboard visibility and available operational actions.">
            <p className="rounded-2xl border border-[#dbe3ea] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#172033]">{security?.accountRole || user?.role || '-'}</p>
          </SettingsRow>
          <SettingsRow icon={CheckCircle2} title="Account status" description="Only active users can access protected ORBEM dashboard routes.">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{user?.is_active === 0 ? 'Inactive' : 'Active'}</span>
          </SettingsRow>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <Button variant="secondary" icon={Mail} onClick={() => { window.location.href = `mailto:${user?.email || ''}`; }}>Email account</Button>
          <Button variant="danger" icon={LogOut} onClick={onLogout}>Logout</Button>
        </div>
      </section>
    </div>
  );
}

function TeamWorkspacePanel({ user }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Team / Workspace</h1>
        <p className="mt-1 text-sm text-gray-500">Operational ownership, staff visibility, and workspace context.</p>
      </div>
      <section className="rounded-[24px] border border-[#dbe3ea] bg-white p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Current role', user?.role || 'Operations Staff'],
            ['Department', user?.department || 'Operations'],
            ['Visibility', 'Team workspace']
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#dbe3ea] bg-[#f8fafc] px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
              <p className="mt-2 truncate text-sm font-bold text-[#172033]">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AccountCenterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, logout, updateUser } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [currentUser, setCurrentUser] = useState(authUser);
  const [activeKey, setActiveKey] = useState(() => (location.pathname === '/profile' ? 'editProfile' : 'personal'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const [ticketSaving, setTicketSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [aiStatus, setAiStatus] = useState({ providers: [] });
  const [aiLoading, setAiLoading] = useState(false);
  const [security, setSecurity] = useState(null);
  const [storageInfo, setStorageInfo] = useState(getStorageInfo);

  const activeItem = useMemo(() => sectionItems.find((item) => item.key === activeKey) || sectionItems[0], [activeKey]);

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!profileDirty) return;
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [profileDirty]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  }

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const [settingsResponse, aiResponse, securityResponse] = await Promise.all([
        settingsService.get(),
        settingsService.aiStatus().catch(() => ({ providers: [] })),
        settingsService.securitySummary().catch(() => null)
      ]);
      setSettings(settingsResponse.settings);
      setCurrentUser(settingsResponse.user || authUser);
      updateUser?.(settingsResponse.user || authUser);
      setAiStatus(aiResponse);
      setSecurity(securityResponse);
      storeAppearanceSettings(settingsResponse.settings.appearance);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function confirmIfDirty() {
    return !profileDirty || window.confirm('You have unsaved profile changes. Leave this section without saving?');
  }

  function selectSection(key) {
    if (key === activeKey) return;
    if (!confirmIfDirty()) return;
    setProfileDirty(false);
    setActiveKey(key);
  }

  async function refreshAiStatus() {
    setAiLoading(true);
    try {
      setAiStatus(await settingsService.aiStatus());
      showToast('AI provider status refreshed.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSettingChange(key, value) {
    const previous = settings;
    const optimistic = setDeepValue(settings, key, value);
    setSettings(optimistic);
    setSavingKey(key);
    if (key.startsWith('appearance.')) storeAppearanceSettings(optimistic.appearance);

    try {
      const response = await settingsService.updateOne(key, value);
      setSettings(response.settings);
      if (key.startsWith('appearance.')) storeAppearanceSettings(response.settings.appearance);
      showToast('Setting saved.');
    } catch (err) {
      setSettings(previous);
      if (key.startsWith('appearance.')) storeAppearanceSettings(previous.appearance);
      setError(getErrorMessage(err));
    } finally {
      setSavingKey('');
    }
  }

  async function handleProfileSave(payload) {
    setProfileSaving(true);
    try {
      const response = await settingsService.updateProfile(payload);
      setSettings(response.settings);
      setCurrentUser(response.user);
      updateUser?.(response.user);
      setProfileDirty(false);
      showToast('Profile saved.');
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setProfileSaving(false);
    }
  }

  function clearLocalCache() {
    Object.keys(localStorage)
      .filter((key) => !['orbem_token', 'orbem_user', 'orbem_appearance_settings'].includes(key) && /cache|dashboard|preferences/i.test(key))
      .forEach((key) => localStorage.removeItem(key));
    setStorageInfo(getStorageInfo());
    showToast('Local cache cleared.');
  }

  function clearChatHistory() {
    localStorage.removeItem('orbem_chat_history');
    showToast('Local chatbot history cleared.');
  }

  function downloadAccountData() {
    downloadJson('orbem-account-data.json', buildAccountDataDownload(currentUser, settings, security));
    showToast('Account data downloaded.');
  }

  async function exportReport(path, filename) {
    try {
      await downloadFile(path, filename);
      localStorage.setItem('orbem_report_exports_count', String(Number(localStorage.getItem('orbem_report_exports_count') || 0) + 1));
      setStorageInfo(getStorageInfo());
      showToast('Export started.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function submitTicket(payload) {
    setTicketSaving(true);
    try {
      await supportService.createTicket(payload);
      showToast('Support ticket submitted.');
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setTicketSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function comingSoon(label) {
    showToast(`${label} is coming soon.`);
  }

  if (loading) return <LoadingState rows={9} />;

  const ActiveIcon = activeItem.icon;
  const sectionProps = {
    user: currentUser,
    settings,
    onSettingChange: handleSettingChange,
    savingKey
  };

  const sections = {
    editProfile: (
      <EditProfileForm
        user={currentUser}
        settings={settings}
        onSave={handleProfileSave}
        saving={profileSaving}
        onDirtyChange={setProfileDirty}
        onCancelSaved={() => showToast('Profile edits reset.')}
      />
    ),
    personal: <PersonalInformationPanel user={currentUser} settings={settings} onEdit={() => selectSection('editProfile')} />,
    login: <AccountLoginPanel user={currentUser} security={security} onLogout={handleLogout} />,
    security: <SecuritySettings {...sectionProps} security={security} onLogout={handleLogout} onComingSoon={comingSoon} />,
    notifications: <NotificationSettings {...sectionProps} />,
    privacy: <PrivacySettings {...sectionProps} />,
    appearance: <AppearanceSettings {...sectionProps} />,
    assistant: (
      <AssistantSettings
        {...sectionProps}
        aiStatus={aiStatus}
        aiLoading={aiLoading}
        onRefreshAi={refreshAiStatus}
        onClearChat={clearChatHistory}
      />
    ),
    team: <TeamWorkspacePanel user={currentUser} />,
    exports: (
      <div className="space-y-5">
        <DataStorageSettings
          settings={settings}
          storageInfo={storageInfo}
          onClearCache={clearLocalCache}
          onClearChat={clearChatHistory}
          onDownloadAccountData={downloadAccountData}
          onExport={exportReport}
        />
        <ReportSettings {...sectionProps} />
      </div>
    ),
    support: <HelpSupportSettings user={currentUser} onSubmitTicket={submitTicket} submitting={ticketSaving} />,
    about: (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">About ORBEM</h1>
          <p className="mt-1 text-sm text-gray-500">Project, company, and version information for the operations dashboard.</p>
        </div>
        <section className="rounded-[24px] border border-[#dbe3ea] bg-white p-5 shadow-card">
          <div className="divide-y divide-gray-100">
            <SettingsRow icon={Info} title="Operations Performance Dashboard" description="Version 1.0.0 for logistics operations management." />
            <SettingsRow icon={Building2} title={COMPANY_NAME} description="Air cargo, shipment tracking, documents, payments, alerts, reporting, and assistant workflows." />
            <SettingsRow icon={CheckCircle2} title="Demo-ready interface" description="Designed for internship, academic review, and internal operations demonstration." />
          </div>
        </section>
      </div>
    )
  };

  return (
    <div className="space-y-5">
      <Toast message={toast} onClose={() => setToast('')} />
      <PageHeader
        title="Account Center"
        description="Unified profile, login, security, notifications, appearance, assistant, reports, and support settings."
        statusText={currentUser?.role || 'Account settings'}
      />

      {error ? <ErrorState title="Account center notice" message={error} onRetry={loadSettings} /> : null}

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
          <ProfileSummaryCard
            user={currentUser}
            profile={settings.profile}
            onEdit={() => selectSection('editProfile')}
            onChangePhoto={() => selectSection('editProfile')}
            onSecurity={() => selectSection('security')}
          />
          <SettingsSectionNav items={sectionItems} activeKey={activeKey} onSelect={selectSection} />
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#dbe3ea] bg-white px-4 py-3 shadow-card">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#2563eb]">
                <ActiveIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-[#0f1f3d]">{activeItem.title}</h2>
                <p className="truncate text-sm text-[#64748b]">{activeItem.subtitle}</p>
              </div>
            </div>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => selectSection('personal')}>Overview</Button>
          </div>
          {sections[activeKey]}
        </section>
      </div>
    </div>
  );
}
