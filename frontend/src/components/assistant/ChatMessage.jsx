import { Bot, User } from 'lucide-react';
import { classNames, formatDate } from '../../utils/formatters';

export default function ChatMessage({ message }) {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={classNames('flex gap-3', isAssistant ? 'justify-start' : 'justify-end')}>
      {isAssistant ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
          <Bot className="h-4 w-4" />
        </div>
      ) : null}
      <div className={classNames('max-w-[82%] rounded-lg px-4 py-3 text-sm shadow-sm', isAssistant ? 'bg-white text-gray-800' : 'bg-brand-600 text-white')}>
        <p className="whitespace-pre-wrap leading-6">{message.message}</p>
        {message.created_at ? (
          <p className={classNames('mt-2 text-xs', isAssistant ? 'text-gray-400' : 'text-brand-100')}>{formatDate(message.created_at)}</p>
        ) : null}
      </div>
      {!isAssistant ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-800 text-white">
          <User className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}
