import { useMemo, useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import LocationAutocompleteInput from '../common/LocationAutocompleteInput';
import Select from '../common/Select';
import { formatNumber } from '../../utils/formatters';

const statuses = [
  'Booked',
  'Picked Up',
  'In Warehouse',
  'Documents Pending',
  'Ready for Dispatch',
  'In Transit',
  'Customs Hold',
  'Delivered',
  'Delayed',
  'Completed',
  'Cancelled'
];
const priorities = ['Low', 'Normal', 'High', 'Critical'];

const emptyBooking = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  company_name: '',
  origin_airport: '',
  destination_airport: '',
  pickup_city: '',
  delivery_city: '',
  cargo_type: '',
  cargo_description: '',
  package_count: 1,
  actual_weight: 0,
  length_cm: 0,
  width_cm: 0,
  height_cm: 0,
  shipment_status: 'Booked',
  booking_date: new Date().toISOString().slice(0, 10),
  expected_delivery_date: '',
  actual_delivery_date: '',
  assigned_owner_id: '',
  priority: 'Normal',
  notes: '',
  quotation_amount: 0,
  invoice_amount: 0,
  paid_amount: 0,
  awb_number: ''
};

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

export default function BookingForm({ initialData, owners = [], onSubmit, submitting = false, submitLabel = 'Save booking' }) {
  const [form, setForm] = useState(() => ({
    ...emptyBooking,
    ...initialData,
    booking_date: dateOnly(initialData?.booking_date) || emptyBooking.booking_date,
    expected_delivery_date: dateOnly(initialData?.expected_delivery_date),
    actual_delivery_date: dateOnly(initialData?.actual_delivery_date),
    assigned_owner_id: initialData?.assigned_owner_id || ''
  }));
  const [errors, setErrors] = useState({});
  const [selectedOriginLocation, setSelectedOriginLocation] = useState(null);
  const [selectedDestinationLocation, setSelectedDestinationLocation] = useState(null);

  const weights = useMemo(() => {
    const volumetric =
      (Number(form.length_cm || 0) *
        Number(form.width_cm || 0) *
        Number(form.height_cm || 0) *
        Number(form.package_count || 1)) /
      6000;
    return {
      volumetric: Number(volumetric.toFixed(2)),
      chargeable: Math.max(Number(form.actual_weight || 0), volumetric)
    };
  }, [form.actual_weight, form.height_cm, form.length_cm, form.package_count, form.width_cm]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateOrigin(value) {
    setSelectedOriginLocation(null);
    updateField('origin_airport', value.toUpperCase());
  }

  function updateDestination(value) {
    setSelectedDestinationLocation(null);
    updateField('destination_airport', value.toUpperCase());
  }

  function selectOriginLocation(location) {
    setSelectedOriginLocation(location);
    updateField('origin_airport', location.code);
  }

  function selectDestinationLocation(location) {
    setSelectedDestinationLocation(location);
    updateField('destination_airport', location.code);
  }

  function validate() {
    const nextErrors = {};
    [
      'customer_name',
      'customer_email',
      'customer_phone',
      'company_name',
      'origin_airport',
      'destination_airport',
      'pickup_city',
      'delivery_city',
      'cargo_type',
      'booking_date',
      'expected_delivery_date'
    ].forEach((field) => {
      if (!form[field]) nextErrors[field] = 'Required';
    });
    if (form.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
      nextErrors.customer_email = 'Enter a valid email';
    }
    ['package_count', 'actual_weight', 'length_cm', 'width_cm', 'height_cm'].forEach((field) => {
      if (Number(form[field]) < 0) nextErrors[field] = 'Cannot be negative';
    });
    if (Number(form.package_count) < 1) nextErrors.package_count = 'Minimum 1';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      origin_airport: form.origin_airport.toUpperCase(),
      destination_airport: form.destination_airport.toUpperCase(),
      actual_delivery_date: form.actual_delivery_date || null,
      assigned_owner_id: form.assigned_owner_id || null,
      package_count: Number(form.package_count),
      actual_weight: Number(form.actual_weight),
      length_cm: Number(form.length_cm),
      width_cm: Number(form.width_cm),
      height_cm: Number(form.height_cm),
      quotation_amount: Number(form.quotation_amount || 0),
      invoice_amount: Number(form.invoice_amount || 0),
      paid_amount: Number(form.paid_amount || 0)
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Customer name" value={form.customer_name} error={errors.customer_name} onChange={(e) => updateField('customer_name', e.target.value)} />
        <Input label="Company name" value={form.company_name} error={errors.company_name} onChange={(e) => updateField('company_name', e.target.value)} />
        <Input label="Customer email" type="email" value={form.customer_email} error={errors.customer_email} onChange={(e) => updateField('customer_email', e.target.value)} />
        <Input label="Customer phone" value={form.customer_phone} error={errors.customer_phone} onChange={(e) => updateField('customer_phone', e.target.value)} />
        <LocationAutocompleteInput
          label="Origin"
          value={form.origin_airport}
          error={errors.origin_airport}
          onChange={updateOrigin}
          onSelect={selectOriginLocation}
          selectionValue="code"
          maxLength={12}
          placeholder="Search city or type airport code..."
        />
        <LocationAutocompleteInput
          label="Destination"
          value={form.destination_airport}
          error={errors.destination_airport}
          onChange={updateDestination}
          onSelect={selectDestinationLocation}
          selectionValue="code"
          maxLength={12}
          placeholder="Search city or type airport code..."
        />
        <Input label="Pickup city" value={form.pickup_city} error={errors.pickup_city} onChange={(e) => updateField('pickup_city', e.target.value)} />
        <Input label="Delivery city" value={form.delivery_city} error={errors.delivery_city} onChange={(e) => updateField('delivery_city', e.target.value)} />
        <Input label="Cargo type" value={form.cargo_type} error={errors.cargo_type} onChange={(e) => updateField('cargo_type', e.target.value)} />
        <Input label="AWB number" value={form.awb_number} error={errors.awb_number} onChange={(e) => updateField('awb_number', e.target.value)} placeholder="e.g. AWB001" />
        <Select label="Assigned owner" value={form.assigned_owner_id} onChange={(e) => updateField('assigned_owner_id', e.target.value)}>
          <option value="">Unassigned</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name} - {owner.role}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Input label="Packages" type="number" min="1" value={form.package_count} error={errors.package_count} onChange={(e) => updateField('package_count', e.target.value)} />
        <Input label="Actual kg" type="number" min="0" step="0.01" value={form.actual_weight} error={errors.actual_weight} onChange={(e) => updateField('actual_weight', e.target.value)} />
        <Input label="Length cm" type="number" min="0" step="0.01" value={form.length_cm} error={errors.length_cm} onChange={(e) => updateField('length_cm', e.target.value)} />
        <Input label="Width cm" type="number" min="0" step="0.01" value={form.width_cm} error={errors.width_cm} onChange={(e) => updateField('width_cm', e.target.value)} />
        <Input label="Height cm" type="number" min="0" step="0.01" value={form.height_cm} error={errors.height_cm} onChange={(e) => updateField('height_cm', e.target.value)} />
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <p>
            <span className="font-medium text-gray-700">Volumetric weight:</span> {formatNumber(weights.volumetric)} kg
          </p>
          <p>
            <span className="font-medium text-gray-700">Chargeable weight:</span> {formatNumber(weights.chargeable)} kg
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Select label="Shipment status" value={form.shipment_status} onChange={(e) => updateField('shipment_status', e.target.value)} options={statuses} />
        <Select label="Priority" value={form.priority} onChange={(e) => updateField('priority', e.target.value)} options={priorities} />
        <Input label="Booking date" type="date" value={form.booking_date} error={errors.booking_date} onChange={(e) => updateField('booking_date', e.target.value)} />
        <Input label="Expected delivery" type="date" value={form.expected_delivery_date} error={errors.expected_delivery_date} onChange={(e) => updateField('expected_delivery_date', e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Input label="Actual delivery" type="date" value={form.actual_delivery_date || ''} onChange={(e) => updateField('actual_delivery_date', e.target.value)} />
        <Input label="Quotation amount" type="number" min="0" step="0.01" value={form.quotation_amount || 0} onChange={(e) => updateField('quotation_amount', e.target.value)} />
        <Input label="Invoice amount" type="number" min="0" step="0.01" value={form.invoice_amount || 0} onChange={(e) => updateField('invoice_amount', e.target.value)} />
        <Input label="Paid amount" type="number" min="0" step="0.01" value={form.paid_amount || 0} onChange={(e) => updateField('paid_amount', e.target.value)} />
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-gray-700">Cargo description</span>
        <textarea
          className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          value={form.cargo_description || ''}
          onChange={(e) => updateField('cargo_description', e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-gray-700">Notes</span>
        <textarea
          className="min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          value={form.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
        />
      </label>

      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
