import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import LoadingState from '../common/LoadingState';
import Select from '../common/Select';
import StatusBadge from '../bookings/StatusBadge';

const statuses = ['Pending', 'Received', 'Verified', 'Rejected'];

export default function DocumentChecklist({ bookingId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

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

  async function saveDocument(document) {
    setSavingId(document.id);
    try {
      const response = await api.put(`/documents/${document.id}/status`, {
        status: document.status,
        file_name: document.file_name,
        file_url: document.file_url,
        remarks: document.remarks
      });
      updateLocal(document.id, 'updated_at', response.data.document.updated_at);
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">File name</th>
              <th className="px-4 py-3">Remarks</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{document.document_type}</div>
                  <div className="mt-1">
                    <StatusBadge status={document.status} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Select value={document.status} options={statuses} onChange={(event) => updateLocal(document.id, 'status', event.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <input
                    className="h-10 w-52 rounded-md border border-gray-300 px-3 text-sm"
                    value={document.file_name || ''}
                    onChange={(event) => updateLocal(document.id, 'file_name', event.target.value)}
                    placeholder="metadata.pdf"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    className="h-10 w-64 rounded-md border border-gray-300 px-3 text-sm"
                    value={document.remarks || ''}
                    onChange={(event) => updateLocal(document.id, 'remarks', event.target.value)}
                    placeholder="Remarks"
                  />
                  {document.status === 'Rejected' ? <p className="mt-1 text-xs text-red-600">Rejected reason required before dispatch.</p> : null}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  <div>Verified by: {document.verified_by || '-'}</div>
                  <div>Updated: {document.updated_at ? new Date(document.updated_at).toLocaleString() : '-'}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button icon={Save} loading={savingId === document.id} onClick={() => saveDocument(document)}>
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
