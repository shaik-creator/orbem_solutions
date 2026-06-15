import { classNames } from '../../utils/formatters';

const styles = {
  Booked: 'bg-gray-100 text-gray-800',
  'Picked Up': 'bg-sky-100 text-sky-800',
  'In Warehouse': 'bg-indigo-100 text-indigo-800',
  'Documents Pending': 'bg-amber-100 text-amber-800',
  'Ready for Dispatch': 'bg-blue-100 text-blue-800',
  'In Transit': 'bg-cyan-100 text-cyan-800',
  'Customs Hold': 'bg-orange-100 text-orange-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
  Delayed: 'bg-red-100 text-red-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-200 text-gray-700',
  Pending: 'bg-amber-100 text-amber-800',
  Partial: 'bg-blue-100 text-blue-800',
  Paid: 'bg-emerald-100 text-emerald-800',
  Overdue: 'bg-red-100 text-red-800',
  Info: 'bg-blue-100 text-blue-800',
  Warning: 'bg-amber-100 text-amber-800',
  Critical: 'bg-red-100 text-red-800',
  Open: 'bg-amber-100 text-amber-800',
  Resolved: 'bg-emerald-100 text-emerald-800',
  Closed: 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Waiting: 'bg-orange-100 text-orange-800',
  'To Do': 'bg-slate-100 text-slate-700'
};

export default function StatusBadge({ status }) {
  return (
    <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', styles[status] || 'bg-gray-100 text-gray-800')}>
      {status || 'Unknown'}
    </span>
  );
}
