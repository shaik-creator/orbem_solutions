import { Database, Download, Eraser, FileDown, HardDrive, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Button from '../common/Button';
import SettingsRow from './SettingsRow';

export default function DataStorageSettings({ settings, storageInfo, onClearCache, onClearChat, onDownloadAccountData, onExport }) {
  const [confirming, setConfirming] = useState(false);
  const profilePictureCount = settings.profile?.avatarUrl ? 1 : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">Data & Storage</h1>
        <p className="mt-1 text-sm text-gray-500">Manage local cache, exports, chatbot history, and account data.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <SettingsRow icon={HardDrive} title="Storage information" description="Local browser storage and dashboard assets.">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">Uploaded profile pictures</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profilePictureCount}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">Report exports</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{storageInfo.reportExports}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">Cached dashboard data</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{storageInfo.cachedDashboardData}</p>
            </div>
          </div>
        </SettingsRow>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <SettingsRow icon={Database} title="Local data actions" description="Clear browser-side data without affecting your login session.">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Eraser} onClick={() => setConfirming(true)}>Clear local cache</Button>
            <Button variant="secondary" icon={Trash2} onClick={onClearChat}>Clear chatbot local history</Button>
            <Button variant="secondary" icon={Download} onClick={onDownloadAccountData}>Download my account data</Button>
          </div>
        </SettingsRow>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <SettingsRow icon={FileDown} title="Exports" description="Download CSV files using existing report APIs.">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Download} onClick={() => onExport('/reports/bookings.csv', 'bookings-report.csv')}>Export bookings CSV</Button>
            <Button variant="secondary" icon={Download} onClick={() => onExport('/reports/revenue.csv', 'payments-report.csv')}>Export payments CSV</Button>
            <Button variant="secondary" icon={Download} onClick={() => onExport('/reports/pending-documents.csv', 'pending-documents-report.csv')}>Export pending documents CSV</Button>
          </div>
        </SettingsRow>
      </div>
      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-gray-950">Clear local cache?</h2>
            <p className="mt-2 text-sm text-gray-500">This removes local dashboard cache and temporary settings data. Your login session is kept.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => { onClearCache(); setConfirming(false); }}>Clear cache</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
