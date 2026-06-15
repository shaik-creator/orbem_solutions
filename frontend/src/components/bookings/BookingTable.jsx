import { Link } from 'react-router-dom';
import { Edit, Eye, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import StatusBadge from './StatusBadge';
import { formatDate, formatNumber } from '../../utils/formatters';

export default function BookingTable({ bookings, onDelete }) {
  if (!bookings.length) {
    return <EmptyState title="No bookings found" message="Bookings matching the current filters will appear here." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#dbe3ea] bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#dbe3ea] text-sm">
          <thead className="bg-[#f8fafc] text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2f7]">
            {bookings.map((booking) => (
              <tr key={booking.id} className="transition hover:bg-[#f8fafc]">
                <td className="orbem-mono px-4 py-3 font-bold text-[#142a52]">{booking.booking_id}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#172033]">{booking.customer_name}</div>
                  <div className="text-xs text-[#64748b]">{booking.company_name}</div>
                </td>
                <td className="px-4 py-3 text-[#344054]">
                  <span className="orbem-route-tag">{booking.origin_airport} to {booking.destination_airport}</span>
                </td>
                <td className="px-4 py-3 text-[#344054]">{formatNumber(booking.chargeable_weight)} kg</td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.shipment_status} />
                </td>
                <td className="px-4 py-3 text-[#344054]">{formatDate(booking.expected_delivery_date)}</td>
                <td className="px-4 py-3 text-[#344054]">{booking.assigned_owner || 'Unassigned'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dbe3ea] text-[#344054] hover:bg-[#f5f7fb]" to={`/bookings/${booking.id}`} aria-label="View booking">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dbe3ea] text-[#344054] hover:bg-[#f5f7fb]" to={`/bookings/${booking.id}?edit=1`} aria-label="Edit booking">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <Button variant="ghost" className="h-9 w-9 px-0 text-red-700 hover:bg-red-50" onClick={() => onDelete(booking)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
