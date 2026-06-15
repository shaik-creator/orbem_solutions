import { classNames } from '../../utils/formatters';

const styles = {
  Low: 'bg-slate-100 text-slate-700',
  Normal: 'bg-blue-100 text-blue-800',
  Medium: 'bg-blue-100 text-blue-800',
  High: 'bg-amber-100 text-amber-800',
  Critical: 'bg-red-100 text-red-800'
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={classNames('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', styles[priority] || styles.Normal)}>
      {priority || 'Normal'}
    </span>
  );
}
