import { classNames } from '../../utils/formatters';

const styles = {
  Booked: 'bg-[#eeedfe] text-[#3c3489]',
  'Picked Up': 'bg-[#e6f1fb] text-[#185fa5]',
  'In Warehouse': 'bg-[#eeedfe] text-[#3c3489]',
  'Documents Pending': 'bg-[#faeeda] text-[#854f0b]',
  'Ready for Dispatch': 'bg-[#e6f1fb] text-[#185fa5]',
  'In Transit': 'bg-[#e6f1fb] text-[#185fa5]',
  'Customs Hold': 'bg-[#faeeda] text-[#854f0b]',
  Delivered: 'bg-[#f1efe8] text-[#5f5e5a]',
  Delayed: 'bg-[#fcebeb] text-[#a32d2d]',
  Completed: 'bg-[#eaf3de] text-[#3b6d11]',
  Cancelled: 'bg-[#eef2f5] text-[#475569]',
  Pending: 'bg-[#faeeda] text-[#854f0b]',
  Received: 'bg-[#e6f1fb] text-[#185fa5]',
  Verified: 'bg-[#eaf3de] text-[#3b6d11]',
  Rejected: 'bg-[#fcebeb] text-[#a32d2d]',
  Partial: 'bg-[#e6f1fb] text-[#185fa5]',
  Paid: 'bg-[#eaf3de] text-[#3b6d11]',
  Overdue: 'bg-[#fcebeb] text-[#a32d2d]',
  Info: 'bg-[#e6f1fb] text-[#185fa5]',
  Warning: 'bg-[#faeeda] text-[#854f0b]',
  Critical: 'bg-[#fcebeb] text-[#a32d2d]',
  Open: 'bg-[#faeeda] text-[#854f0b]',
  Resolved: 'bg-[#eaf3de] text-[#3b6d11]',
  Closed: 'bg-[#eef2f5] text-[#475569]',
  'In Progress': 'bg-[#e6f1fb] text-[#185fa5]',
  Waiting: 'bg-[#faeeda] text-[#854f0b]',
  'To Do': 'bg-[#eef2f5] text-[#475569]'
};

export default function StatusBadge({ status }) {
  return (
    <span className={classNames('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-5', styles[status] || 'bg-[#eef2f5] text-[#475569]')}>
      {status || 'Unknown'}
    </span>
  );
}
