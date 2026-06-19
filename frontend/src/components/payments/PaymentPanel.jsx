import { useState } from 'react';
import { Save } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { formatCurrency } from '../../utils/formatters';

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

  const invoice = Number(form.invoice_amount || 0);
  const paid = Number(form.paid_amount || 0);
  const balance = Math.max(invoice - paid, 0);

  // Calculate computed status dynamically
  let computedStatus = 'Pending';
  if (balance <= 0) {
    computedStatus = 'Paid';
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = form.due_date ? new Date(form.due_date) : null;
    if (due) due.setHours(0, 0, 0, 0);

    if (due && due < today) {
      computedStatus = 'Overdue';
    } else if (paid > 0) {
      computedStatus = 'Partial';
    } else {
      computedStatus = 'Pending';
    }
  }

  function submit(event) {
    event.preventDefault();
    onSave({
      ...form,
      quotation_amount: Number(form.quotation_amount || 0),
      invoice_amount: invoice,
      paid_amount: paid,
      balance_amount: balance,
      payment_status: computedStatus,
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
        <Select label="Payment status (calculated)" value={computedStatus} options={statuses} disabled onChange={() => {}} />
        <Input label="Payment date" type="date" value={form.payment_date || ''} onChange={(e) => update('payment_date', e.target.value)} />
        <Input label="Due date" type="date" value={form.due_date || ''} onChange={(e) => update('due_date', e.target.value)} />
      </div>
      <Input label="Payment method" value={form.payment_method || ''} onChange={(e) => update('payment_method', e.target.value)} />

      {/* Real-time Summary Card */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800/80 dark:bg-gray-900/30">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Real-time Preview</h4>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-medium text-gray-400">Calculated Balance</div>
            <div className="text-base font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(balance)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-400">Calculated Status</div>
            <div className="mt-1">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                computedStatus === 'Paid' ? 'bg-[#eaf3de] text-[#3b6d11]' :
                computedStatus === 'Partial' ? 'bg-[#e6f1fb] text-[#185fa5]' :
                computedStatus === 'Overdue' ? 'bg-[#fcebeb] text-[#a32d2d]' :
                'bg-[#faeeda] text-[#854f0b]'
              }`}>
                {computedStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" icon={Save} loading={saving}>
          Save payment
        </Button>
      </div>
    </form>
  );
}
