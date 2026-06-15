import { Bot } from 'lucide-react';

export default function ChatbotButton({ onClick }) {
  return (
    <button
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700 no-print"
      onClick={onClick}
      aria-label="Open ORBEM Ops Assistant"
    >
      <Bot className="h-6 w-6" />
    </button>
  );
}
