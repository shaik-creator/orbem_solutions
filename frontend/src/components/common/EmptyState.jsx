import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ title = 'No records found', message = 'Try adjusting filters or add a new record.', actionLabel, onAction }) {
  return (
    <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <Inbox className="mx-auto h-8 w-8 text-gray-400" />
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {actionLabel && onAction ? (
        <Button className="mt-4" onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </div>
  );
}
