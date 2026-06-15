import { useState } from 'react';
import { Save } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

const statuses = ['Pending', 'Partial', 'Paid', 'Overdue'];

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

export default function PaymentPanel({ payment, onSave, saving = false }) {
  const [form, setForm] = useState({
    quotation_amount: payment?.quotation_amount || 0,
    invoice_amount: payment?.invoice_amount || 0,
    paid_amount: payment?.paid_amount || 0,
    payment_status: payment?.payment_status || 'Pending',
    payment_date: dateOnly(payment?.payment_date),
    payment_method: payment?.payment_method || '',
    due_date: dateOnly(payment?.due_date)
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave({
      ...form,
      quotation_amount: Number(form.quotation_amount || 0),
      invoice_amount: Number(form.invoice_amount || 0),
      paid_amount: Number(form.paid_amount || 0),
      payment_date: form.payment_date || null,
      due_date: form.due_date || null
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Input label="Quotation amount" type="number" min="0" step="0.01" value={form.quotation_amount} onChange={(e) => update('quotation_amount', e.target.value)} />
        <Input label="Invoice amount" type="number" min="0" step="0.01" value={form.invoice_amount} onChange={(e) => update('invoice_amount', e.target.value)} />
        <Input label="Paid amount" type="number" min="0" step="0.01" value={form.paid_amount} onChange={(e) => update('paid_amount', e.target.value)} />
        <Select label="Payment status" value={form.payment_status} options={statuses} onChange={(e) => update('payment_status', e.target.value)} />
        <Input label="Payment date" type="date" value={form.payment_date || ''} onChange={(e) => update('payment_date', e.target.value)} />
        <Input label="Due date" type="date" value={form.due_date || ''} onChange={(e) => update('due_date', e.target.value)} />
      </div>
      <Input label="Payment method" value={form.payment_method || ''} onChange={(e) => update('payment_method', e.target.value)} />
      <div className="flex justify-end">
        <Button type="submit" icon={Save} loading={saving}>
          Save payment
        </Button>
      </div>
    </form>
  );
}
