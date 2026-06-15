import StatusBadge from './StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

export default function BookingDetails({ booking, milestones = [] }) {
  const facts = [
    ['Booking ID', booking.booking_id],
    ['Customer', `${booking.customer_name} (${booking.company_name})`],
    ['Route', `${booking.origin_airport} to ${booking.destination_airport}`],
    ['Pickup city', booking.pickup_city],
    ['Delivery city', booking.delivery_city],
    ['Cargo type', booking.cargo_type],
    ['Packages', booking.package_count],
    ['Actual weight', `${formatNumber(booking.actual_weight)} kg`],
    ['Volumetric weight', `${formatNumber(booking.volumetric_weight)} kg`],
    ['Chargeable weight', `${formatNumber(booking.chargeable_weight)} kg`],
    ['Booking date', formatDate(booking.booking_date)],
    ['Expected delivery', formatDate(booking.expected_delivery_date)],
    ['Actual delivery', formatDate(booking.actual_delivery_date)],
    ['Assigned owner', booking.assigned_owner || 'Unassigned'],
    ['Priority', booking.priority],
    ['Invoice', formatCurrency(booking.invoice_amount)],
    ['Paid', formatCurrency(booking.paid_amount)],
    ['Balance', formatCurrency(booking.balance_amount)]
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-950">{booking.booking_id}</h1>
            <p className="mt-1 text-sm text-gray-500">{booking.cargo_description || 'No cargo description added.'}</p>
          </div>
          <StatusBadge status={booking.shipment_status} />
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{value || '-'}</dd>
            </div>
          ))}
        </dl>
        {booking.notes ? (
          <div className="mt-5 rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Notes</p>
            <p className="mt-1">{booking.notes}</p>
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900">Milestone Timeline</h2>
        <div className="mt-4 space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id || milestone.created_at} className="border-l-2 border-brand-600 pl-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{milestone.status}</p>
                <p className="text-xs text-gray-500">{formatDate(milestone.created_at)}</p>
              </div>
              <p className="mt-1 text-sm text-gray-600">{milestone.location || 'Operations'} {milestone.updated_by || milestone.created_by_name ? `- ${milestone.updated_by || milestone.created_by_name}` : ''}</p>
              {milestone.remarks ? <p className="mt-1 text-sm text-gray-500">{milestone.remarks}</p> : null}
            </div>
          ))}
          {!milestones.length ? <p className="text-sm text-gray-500">No milestones recorded.</p> : null}
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Priority</p>
          <PriorityBadge priority={booking.priority} />
        </div>
      </div>
    </div>
  );
}
