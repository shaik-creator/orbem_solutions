import { useEffect, useState } from 'react';
import { ExternalLink, FileCheck2, FileText, FileWarning, FileX2, Save, Upload } from 'lucide-react';
import api, { API_BASE_URL, getErrorMessage } from '../../services/api';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import LoadingState from '../common/LoadingState';
import Select from '../common/Select';
import StatusBadge from '../bookings/StatusBadge';

const statuses = ['Pending', 'Received', 'Verified', 'Rejected'];

const statusMeta = {
  Verified: { icon: FileCheck2, iconClass: 'bg-[#eaf3de] text-[#3b6d11]' },
  Received: { icon: FileText, iconClass: 'bg-[#e6f1fb] text-[#185fa5]' },
  Pending: { icon: FileWarning, iconClass: 'bg-[#faeeda] text-[#854f0b]' },
  Rejected: { icon: FileX2, iconClass: 'bg-[#fcebeb] text-[#a32d2d]' }
};

export default function DocumentChecklist({ bookingId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});

  async function loadDocuments() {
    if (!bookingId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/documents/booking/${bookingId}`);
      setDocuments(response.data.documents);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [bookingId]);

  function updateLocal(id, field, value) {
    setDocuments((current) => current.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc)));
  }

  function updateSelectedFile(id, file) {
    setSelectedFiles((current) => ({ ...current, [id]: file || null }));
    if (file) updateLocal(id, 'file_name', file.name);
  }

  function getFileHref(document) {
    const path = document.file_path || document.file_url;
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async function saveDocument(document) {
    setSavingId(document.id);
    try {
      const payload = new FormData();
      payload.append('status', document.status);
      payload.append('file_name', document.file_name || '');
      payload.append('file_url', document.file_url || '');
      payload.append('remarks', document.remarks || '');
      if (selectedFiles[document.id]) payload.append('file', selectedFiles[document.id]);

      const response = await api.put(`/documents/${document.id}/status`, payload);
      setDocuments((current) =>
        current.map((doc) => (doc.id === document.id ? { ...doc, ...response.data.document } : doc))
      );
      setSelectedFiles((current) => ({ ...current, [document.id]: null }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  if (!bookingId) return <EmptyState title="Select a booking" message="Document checklist will load after a booking is selected." />;
  if (loading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error} onRetry={loadDocuments} />;
  if (!documents.length) return <EmptyState title="No documents" message="No document records are attached to this booking." />;

  return (
    <div className="overflow-hidden rounded-lg border border-[#dbe3ea] bg-white shadow-card">
      <div className="divide-y divide-[#edf2f7]">
        {documents.map((document) => {
          const meta = statusMeta[document.status] || statusMeta.Pending;
          const Icon = meta.icon;
          const selectedFile = selectedFiles[document.id];
          const fileHref = getFileHref(document);
          return (
            <div key={document.id} className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(0,1.2fr)_150px_minmax(160px,1fr)_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconClass}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#172033]">{document.document_type}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#64748b]">{selectedFile?.name || document.file_name || 'No file uploaded'}</p>
                </div>
              </div>

              <Select value={document.status} options={statuses} onChange={(event) => updateLocal(document.id, 'status', event.target.value)} />

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <input
                  className="h-10 rounded-lg border border-[#dbe3ea] px-3 text-xs text-[#172033]"
                  value={document.file_name || ''}
                  onChange={(event) => updateLocal(document.id, 'file_name', event.target.value)}
                  placeholder="metadata.pdf"
                />
                <input
                  className="h-10 rounded-lg border border-[#dbe3ea] px-3 text-xs text-[#172033]"
                  value={document.remarks || ''}
                  onChange={(event) => updateLocal(document.id, 'remarks', event.target.value)}
                  placeholder="Remarks"
                />
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#dbe3ea] bg-white px-3 text-xs font-semibold text-[#344054] hover:bg-[#f5f7fb]">
                  <Upload className="h-4 w-4" />
                  <span>{selectedFile ? 'Change' : 'Upload'}</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={(event) => updateSelectedFile(document.id, event.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <StatusBadge status={document.status} />
                {fileHref ? (
                  <a
                    href={fileHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#dbe3ea] bg-white px-3 text-xs font-semibold text-[#344054] hover:bg-[#f5f7fb]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </a>
                ) : null}
                <Button icon={Save} loading={savingId === document.id} onClick={() => saveDocument(document)} className="min-h-9 px-3 text-xs">
                  Save
                </Button>
              </div>
              {document.status === 'Rejected' ? <p className="text-xs text-red-600 lg:col-span-4">Rejected reason required before dispatch.</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
