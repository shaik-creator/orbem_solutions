import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ title = 'Unable to load data', message = 'Something went wrong.', onRetry }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          <p className="mt-1">{message}</p>
          {onRetry ? (
            <Button variant="secondary" className="mt-3" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
