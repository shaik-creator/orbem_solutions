import { Bot, CheckCircle2, Eraser, MessageSquareText, Sparkles, XCircle } from 'lucide-react';
import Button from '../common/Button';
import Select from '../common/Select';
import SettingsRow from './SettingsRow';
import ToggleSwitch from './ToggleSwitch';

const toggleRows = [
  ['assistant.enabled', Bot, 'Enable ORBEM Ops Assistant', 'Show assistant access and allow operations chat features.'],
  ['assistant.allowDashboardSummary', Sparkles, 'Allow dashboard summaries', 'Let the assistant summarize KPIs, delayed shipments, documents, and payments.'],
  ['assistant.allowCustomerMessages', MessageSquareText, 'Draft customer messages', 'Allow customer-facing drafts using booking context.']
];

export default function AssistantSettings({ settings, aiStatus, aiLoading, onRefreshAi, onSettingChange, onClearChat, savingKey }) {
  const assistant = settings.assistant;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Chat / AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">Control assistant access, tone, context, and provider visibility.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="divide-y divide-gray-100">
          {toggleRows.map(([key, Icon, title, description]) => {
            const field = key.split('.')[1];
            return (
              <SettingsRow
                key={key}
                icon={Icon}
                title={title}
                description={description}
                control={<ToggleSwitch checked={Boolean(assistant[field])} disabled={savingKey === key} onChange={(value) => onSettingChange(key, value)} label={title} />}
              />
            );
          })}
          <SettingsRow icon={MessageSquareText} title="Assistant tone" description="Choose how responses should read.">
            <Select
              value={assistant.tone}
              onChange={(event) => onSettingChange('assistant.tone', event.target.value)}
              options={[
                { value: 'professional', label: 'Professional' },
                { value: 'short', label: 'Short and direct' },
                { value: 'detailed', label: 'Detailed explanation' }
              ]}
            />
          </SettingsRow>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Provider status</h2>
            <p className="mt-1 text-sm text-gray-500">Backend reports status without exposing API keys.</p>
          </div>
          <Button variant="secondary" onClick={onRefreshAi} loading={aiLoading}>Refresh</Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(aiStatus?.providers || []).map((provider) => {
            const connected = ['connected', 'configured'].includes(provider.status);
            return (
              <div key={provider.provider} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  {connected ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                  <p className="text-sm font-semibold text-gray-900">{provider.provider}</p>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{provider.status}</p>
                <p className="mt-1 text-sm text-gray-500">{provider.detail}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <Button variant="secondary" icon={Eraser} onClick={onClearChat}>Clear chat history</Button>
        </div>
      </div>
    </div>
  );
}
