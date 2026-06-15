import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({ title, open, onClose, children, size = 'max-w-3xl' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className={`max-h-[90vh] w-full ${size} overflow-hidden rounded-lg bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <Button variant="ghost" className="h-9 w-9 px-0" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
