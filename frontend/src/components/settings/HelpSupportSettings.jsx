import { Bug, HelpCircle, Keyboard, LifeBuoy, Lightbulb, Send } from 'lucide-react';
import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import SettingsRow from './SettingsRow';

const faqs = [
  ['How do I export bookings?', 'Use Reports or Data & Storage settings to download the bookings CSV.'],
  ['Why are alerts delayed?', 'Alerts depend on shipment status, due dates, and the backend alert check schedule.'],
  ['Where are API keys stored?', 'Optional provider keys stay on the backend and are never returned to the frontend.']
];

export default function HelpSupportSettings({ onSubmitTicket, submitting, user }) {
  const [bug, setBug] = useState({ title: '', module: 'Settings', description: '', priority: 'Medium' });
  const [feature, setFeature] = useState({ title: '', module: 'Feature request', description: '', priority: 'Low' });

  function updateBug(field, value) {
    setBug((current) => ({ ...current, [field]: value }));
  }

  function updateFeature(field, value) {
    setFeature((current) => ({ ...current, [field]: value }));
  }

  async function submit(event, payload, reset) {
    event.preventDefault();
    const saved = await onSubmitTicket(payload);
    if (saved) reset();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Help & Support</h1>
        <p className="mt-1 text-sm text-gray-500">Find answers, contact admins, or send project feedback.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <SettingsRow icon={HelpCircle} title="FAQ" description="Quick answers for common settings questions.">
          <div className="space-y-3">
            {faqs.map(([question, answer]) => (
              <div key={question} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">{question}</p>
                <p className="mt-1 text-sm text-gray-500">{answer}</p>
              </div>
            ))}
          </div>
        </SettingsRow>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <form className="rounded-lg border border-gray-200 bg-white p-5 shadow-card" onSubmit={(event) => submit(event, bug, () => setBug({ title: '', module: 'Settings', description: '', priority: 'Medium' }))}>
          <SettingsRow icon={Bug} title="Report a bug" description="Send an issue to the support tickets table.">
            <div className="grid gap-3">
              <Input label="Issue title" value={bug.title} onChange={(event) => updateBug('title', event.target.value)} required />
              <Input label="Page/module" value={bug.module} onChange={(event) => updateBug('module', event.target.value)} />
              <Select label="Priority" value={bug.priority} onChange={(event) => updateBug('priority', event.target.value)} options={['Low', 'Medium', 'High', 'Critical']} />
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Description</span>
                <textarea className="min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" value={bug.description} onChange={(event) => updateBug('description', event.target.value)} required />
              </label>
              <Button type="submit" icon={Send} loading={submitting}>Submit bug report</Button>
            </div>
          </SettingsRow>
        </form>
        <form className="rounded-lg border border-gray-200 bg-white p-5 shadow-card" onSubmit={(event) => submit(event, feature, () => setFeature({ title: '', module: 'Feature request', description: '', priority: 'Low' }))}>
          <SettingsRow icon={Lightbulb} title="Request feature" description="Capture improvement ideas for future dashboard versions.">
            <div className="grid gap-3">
              <Input label="Feature title" value={feature.title} onChange={(event) => updateFeature('title', event.target.value)} required />
              <Input label="Area/module" value={feature.module} onChange={(event) => updateFeature('module', event.target.value)} />
              <Select label="Priority" value={feature.priority} onChange={(event) => updateFeature('priority', event.target.value)} options={['Low', 'Medium', 'High', 'Critical']} />
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Description</span>
                <textarea className="min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" value={feature.description} onChange={(event) => updateFeature('description', event.target.value)} required />
              </label>
              <Button type="submit" icon={Send} loading={submitting}>Submit feature request</Button>
            </div>
          </SettingsRow>
        </form>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <LifeBuoy className="h-5 w-5 text-brand-600" />
          <h2 className="mt-3 text-sm font-semibold text-gray-900">Contact admin</h2>
          <p className="mt-1 text-sm text-gray-500">Signed in as {user?.email}. Contact the Admin / Owner for role, access, or data corrections.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <Keyboard className="h-5 w-5 text-brand-600" />
          <h2 className="mt-3 text-sm font-semibold text-gray-900">Keyboard shortcuts</h2>
          <p className="mt-1 text-sm text-gray-500">Enter submits search, browser back returns to the previous module, and print uses the Reports print button.</p>
        </div>
      </div>
    </div>
  );
}
