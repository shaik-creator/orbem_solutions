import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { assistantService } from '../../services/assistantService';
import { getErrorMessage } from '../../services/api';
import Button from '../common/Button';
import ChatMessage from './ChatMessage';

export default function ChatbotPanel({ open = true, onClose, embedded = false, prefill = '' }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  async function loadHistory() {
    setLoading(true);
    setError('');
    try {
      const history = await assistantService.history();
      setMessages(history);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadHistory();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (prefill) setDraft(prefill);
  }, [prefill]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setError('');
    const userMessage = { id: `local-${Date.now()}`, role: 'user', message: text, created_at: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]);
    setSending(true);
    try {
      const response = await assistantService.chat(text);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          message: response.reply,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const content = (
    <div className="flex h-full flex-col bg-gray-100">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">ORBEM Ops Assistant</h2>
          <p className="text-xs text-gray-500">Operations support</p>
        </div>
        {!embedded ? (
          <Button variant="ghost" className="h-9 w-9 px-0" onClick={onClose} aria-label="Close assistant">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {loading ? <p className="text-sm text-gray-500">Loading chat history...</p> : null}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {sending ? <ChatMessage message={{ role: 'assistant', message: 'Checking operations data...' }} /> : null}
        {!messages.length && !loading ? (
          <div className="rounded-md border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
            No messages yet.
          </div>
        ) : null}
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="border-t border-gray-200 bg-white p-3">
        <div className="flex gap-2">
          <input
            className="min-h-11 flex-1 rounded-md border border-gray-300 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about bookings, alerts, documents, weather, rates"
          />
          <Button type="submit" icon={Send} loading={sending}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );

  if (embedded) {
    return <div className="h-[calc(100vh-9rem)] overflow-hidden rounded-lg border border-gray-200 shadow-card">{content}</div>;
  }

  return <div className="fixed bottom-24 right-5 z-40 h-[620px] max-h-[calc(100vh-8rem)] w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-gray-200 shadow-xl no-print">{content}</div>;
}
