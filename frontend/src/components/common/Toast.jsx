import { CheckCircle2, X } from 'lucide-react';
import Button from './Button';

export default function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed right-4 top-20 z-50 flex max-w-md items-start gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-xl no-print">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p className="min-w-0 flex-1">{message}</p>
      <Button variant="ghost" className="h-7 w-7 px-0" onClick={onClose} aria-label="Close toast">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
