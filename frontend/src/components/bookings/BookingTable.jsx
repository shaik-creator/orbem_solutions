import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Edit, Eye, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import StatusBadge from './StatusBadge';
import { classNames, formatDate, formatNumber } from '../../utils/formatters';

function docsLabel(booking) {
  if (booking.shipment_status === 'Delivered' || booking.shipment_status === 'Completed') return { text: '4/4', tone: 'text-[#1d9e75]', done: true };
  if (booking.shipment_status === 'Documents Pending' || booking.shipment_status === 'Customs Hold') return { text: '2/4', tone: 'text-[#e24b4a]', done: false };
  if (booking.shipment_status === 'Ready for Dispatch' || booking.shipment_status === 'In Transit') return { text: '3/4', tone: 'text-[#ef9f27]', done: false };
  return { text: '0/4', tone: 'text-[#ef9f27]', done: false };
}

export default function BookingTable({
  bookings,
  onDelete,
  selectedIds = [],
  onToggleRowSelection,
  onToggleAllVisible,
  allVisibleSelected = false,
  someVisibleSelected = false,
  selectionType = 'booking'
}) {
  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  if (!bookings.length) {
    return <EmptyState title="No bookings found" message="Bookings matching the current filters will appear here." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#dbe3ea] bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#dbe3ea] text-xs">
          <thead className="bg-[#f8fafc] text-left text-[11px] font-semibold uppercase tracking-[0.03em] text-[#64748b]">
            <tr>
              <th className="w-9 px-3 py-2">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded-[3px] border-[#0f1f3d] text-[#0f1f3d] focus:ring-[#0f1f3d]"
                  checked={allVisibleSelected}
                  onChange={(event) => {
                    event.stopPropagation();
                    onToggleAllVisible?.();
                  }}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Select all visible ${selectionType === 'shipment' ? 'shipments' : 'bookings'}`}
                />
              </th>
              <th className="px-3 py-2">AWB / Route</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Chg. Weight</th>
              <th className="px-3 py-2">Cargo</th>
              <th className="px-3 py-2">Booked on</th>
              <th className="px-3 py-2">ETA</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-3 py-2">Docs</th>
              <th className="w-24 px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2f7]">
            {bookings.map((booking) => {
              const docs = docsLabel(booking);
              const isSelected = selectedIds.includes(booking.id);
              const selectionLabel =
                selectionType === 'shipment'
                  ? `Select shipment AWB ${booking.awb_number || booking.booking_id}`
                  : `Select booking ${booking.booking_id}`;
              return (
              <tr key={booking.id} className={classNames('transition hover:bg-[#f8fafc]', isSelected ? 'bg-[#eff6ff]' : '')}>
                <td className={classNames('px-3 py-2', isSelected ? 'shadow-[inset_3px_0_0_#2563eb]' : '')}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded-[3px] border-[#cbd5e1] text-[#0f1f3d] focus:ring-[#0f1f3d]"
                    checked={isSelected}
                    onChange={(event) => {
                      event.stopPropagation();
                      onToggleRowSelection?.(booking.id);
                    }}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={selectionLabel}
                  />
                </td>
                <td className="px-3 py-2">
                  <Link to={`/bookings/${booking.id}`} className="orbem-mono text-[11px] font-bold text-[#0f1f3d] hover:text-[#1d9e75]">
                    {booking.booking_id}
                  </Link>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded border border-[#dbe3ea] bg-[#f8fafc] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#172033]">{booking.origin_airport || '---'}</span>
                    <ArrowRight className="h-3 w-3 text-[#94a3b8]" />
                    <span className="rounded border border-[#dbe3ea] bg-[#f8fafc] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#172033]">{booking.destination_airport || '---'}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="max-w-[170px] truncate text-xs font-semibold text-[#172033]">{booking.customer_name}</div>
                  <div className="mt-0.5 max-w-[170px] truncate text-[10px] text-[#64748b]">{booking.customer_phone || booking.company_name}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-[13px] font-semibold text-[#172033]">{formatNumber(booking.chargeable_weight, 0)}</div>
                  <div className="text-[10px] text-[#64748b]">kg chargeable</div>
                </td>
                <td className="px-3 py-2">
                  <span className="max-w-[130px] truncate text-[11px] font-semibold text-[#64748b]">{booking.cargo_type || 'Air cargo'}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="text-[11px] font-medium text-[#172033]">{formatDate(booking.booking_date)}</div>
                  <div className="mt-0.5 text-[10px] text-[#94a3b8]">{booking.assigned_owner || 'Unassigned'}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-[11px] font-medium text-[#172033]">{formatDate(booking.expected_delivery_date)}</div>
                  <div className="mt-0.5 text-[10px] text-[#94a3b8]">{booking.priority || 'Normal'}</div>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={booking.shipment_status} />
                </td>
                <td className="px-3 py-2">
                  <span className={classNames('text-[11px] font-bold', docs.tone)}>{docs.text} {docs.done ? 'OK' : '!'}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Link className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#dbe3ea] text-[#64748b] hover:bg-[#f5f7fb] hover:text-[#172033]" to={`/bookings/${booking.id}`} aria-label="View booking">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <Link className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#dbe3ea] text-[#64748b] hover:bg-[#f5f7fb] hover:text-[#172033]" to={`/bookings/${booking.id}?edit=1`} aria-label="Edit booking">
                      <Edit className="h-3.5 w-3.5" />
                    </Link>
                    <Button variant="ghost" className="h-7 w-7 rounded-md px-0 text-red-700 hover:bg-red-50" onClick={() => onDelete(booking)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2f7] bg-[#f8fafc] px-4 py-3">
        <p className="text-[11px] font-medium text-[#64748b]">Showing {bookings.length} bookings - compact operations view</p>
        <div className="flex gap-1">
          {['<', '1', '2', '3', '>'].map((item) => (
            <span key={item} className={classNames('flex h-7 w-7 items-center justify-center rounded-md border text-[11px] font-semibold', item === '1' ? 'border-[#0f1f3d] bg-[#0f1f3d] text-white' : 'border-[#dbe3ea] bg-white text-[#64748b]')}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
