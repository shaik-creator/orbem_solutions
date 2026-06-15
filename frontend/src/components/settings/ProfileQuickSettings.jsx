import { Camera, Save, Trash2, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import SettingsRow from './SettingsRow';

const statusOptions = [
  '',
  'Available',
  'Busy with operations',
  'In documentation review',
  'On warehouse duty',
  'In accounts follow-up',
  'Custom status'
];

function initials(name) {
  return String(name || 'User')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ProfileQuickSettings({ user, settings, onSave, saving }) {
  const inputRef = useRef(null);
  const profile = settings.profile || {};
  const [draft, setDraft] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    status_message: user?.status_message || '',
    customStatus: '',
    bio: profile.bio || '',
    department: profile.department || '',
    designation: profile.designation || '',
    avatarUrl: profile.avatarUrl || ''
  });

  useEffect(() => {
    setDraft({
      name: user?.name || '',
      phone: user?.phone || '',
      status_message: user?.status_message || '',
      customStatus: '',
      bio: profile.bio || '',
      department: profile.department || '',
      designation: profile.designation || '',
      avatarUrl: profile.avatarUrl || ''
    });
  }, [user?.id, user?.name, user?.phone, user?.status_message, profile.bio, profile.department, profile.designation, profile.avatarUrl]);

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

  function submit(event) {
    event.preventDefault();
    onSave({
      name: draft.name,
      phone: draft.phone,
      status_message: draft.status_message === 'Custom status' ? draft.customStatus : draft.status_message,
      bio: draft.bio,
      department: draft.department,
      designation: draft.designation,
      avatarUrl: draft.avatarUrl
    });
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Quick profile controls for your operations identity.</p>
      </div>
      <div className="rounded-lg border border-[#dbe3ea] bg-white p-5 shadow-card">
        <SettingsRow icon={UserRound} title="Profile photo" description="Use a clear staff photo or initials for quick recognition.">
          <div className="flex flex-wrap items-center gap-3">
            {draft.avatarUrl ? (
              <img src={draft.avatarUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-[#1d9e75] to-[#2563eb] text-lg font-bold text-white">
                {initials(draft.name)}
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={choosePhoto} />
            <Button variant="secondary" icon={Camera} onClick={() => inputRef.current?.click()}>Change photo</Button>
            <Button variant="ghost" icon={Trash2} onClick={() => update('avatarUrl', '')}>Remove photo</Button>
          </div>
        </SettingsRow>
      </div>
      <div className="rounded-lg border border-[#dbe3ea] bg-white p-5 shadow-card">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Display name" value={draft.name} onChange={(event) => update('name', event.target.value)} />
          <Input label="Phone number" value={draft.phone} onChange={(event) => update('phone', event.target.value)} />
          <Input label="Department" value={draft.department} onChange={(event) => update('department', event.target.value)} />
          <Input label="Designation" value={draft.designation} onChange={(event) => update('designation', event.target.value)} />
          <Select label="Status message" value={statusOptions.includes(draft.status_message) ? draft.status_message : 'Custom status'} onChange={(event) => update('status_message', event.target.value)} options={statusOptions.map((value) => ({ value, label: value || 'No status' }))} />
          {draft.status_message === 'Custom status' ? (
            <Input label="Custom status" value={draft.customStatus} onChange={(event) => update('customStatus', event.target.value)} />
          ) : null}
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Bio</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-[#dbe3ea] bg-white px-3 py-2 text-sm text-[#172033] shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value={draft.bio}
              onChange={(event) => update('bio', event.target.value)}
              placeholder="Short internal note for team context"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" icon={Save} loading={saving}>Save profile</Button>
        </div>
      </div>
    </form>
  );
}
