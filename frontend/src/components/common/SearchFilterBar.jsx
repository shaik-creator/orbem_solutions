import { Search, X } from 'lucide-react';
import Button from './Button';
import Input from './Input';

export default function SearchFilterBar({ value, onChange, onSearch, onClear, placeholder = 'Search records', children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-card no-print">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto]">
        <Input label="Search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
        <div className="flex items-end gap-2">
          <Button variant="secondary" icon={X} onClick={onClear}>Clear</Button>
          <Button icon={Search} onClick={onSearch}>Search</Button>
        </div>
      </div>
      {children ? <div className="mt-3 grid gap-3 md:grid-cols-4">{children}</div> : null}
    </div>
  );
}
