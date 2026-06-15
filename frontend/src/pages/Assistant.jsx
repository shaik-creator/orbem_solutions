import { useState } from 'react';
import { ClipboardList, FileCheck2, MessageSquareText, PackageSearch, Sparkles, Wand2 } from 'lucide-react';
import ChatbotPanel from '../components/assistant/ChatbotPanel';
import PageHeader from '../components/common/PageHeader';

const tools = [
  ["Summarize today's operations", 'Summarize today operations: bookings created today, shipments expected today, pending documents, payments due, and delayed shipments.', Sparkles],
  ['Draft customer update', 'Draft a professional customer update for a shipment. Ask me for the booking ID if needed.', MessageSquareText],
  ['Create payment reminder', 'Create a polite payment reminder for an overdue or pending payment. Ask me for the booking ID if needed.', ClipboardList],
  ['Explain delayed shipment', 'Explain the likely operational reasons and next actions for a delayed shipment. Ask me for the booking ID if needed.', PackageSearch],
  ['Generate document checklist', 'Generate a document checklist for an air cargo shipment and explain what each document is used for.', FileCheck2],
  ['Clean cargo description', 'Clean and professionalize this cargo description for an airway bill: ', Wand2]
];

export default function Assistant() {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="space-y-6">
      <PageHeader title="ORBEM Ops Assistant" description="Fast logistics prompts for operations summaries, customer messages, payments, delays, documents, and cargo text." />
      <div className="grid gap-3 md:grid-cols-3">
        {tools.map(([title, text, Icon]) => (
          <button
            key={title}
            type="button"
            onClick={() => setPrompt(text)}
            className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-card transition hover:border-brand-500 hover:bg-gray-50"
          >
            <Icon className="h-5 w-5 text-brand-600" />
            <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">Send this prompt to the assistant.</p>
          </button>
        ))}
      </div>
      <ChatbotPanel embedded prefill={prompt} />
    </div>
  );
}
