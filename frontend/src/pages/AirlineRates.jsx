import { useEffect, useMemo, useState } from 'react';
import { Download, Edit, Plane, Search, Trash2, Upload } from 'lucide-react';
import api, { downloadFile, getErrorMessage } from '../services/api';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';
import LocationAutocompleteInput from '../components/common/LocationAutocompleteInput';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/common/Modal';
import PageHeader from '../components/common/PageHeader';
import { formatCurrency, formatDate } from '../utils/formatters';

const emptyRate = {
  airline_name: '',
  origin_airport: '',
  destination_airport: '',
  rate_per_kg: 0,
  fuel_surcharge: 0,
  handling_charge: 0,
  valid_from: new Date().toISOString().slice(0, 10),
  valid_to: '',
  notes: ''
};

function RateForm({ initial, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    ...emptyRate,
    ...initial,
    valid_from: initial?.valid_from ? String(initial.valid_from).slice(0, 10) : emptyRate.valid_from,
    valid_to: initial?.valid_to ? String(initial.valid_to).slice(0, 10) : ''
  }));
  const [selectedOriginLocation, setSelectedOriginLocation] = useState(null);
  const [selectedDestinationLocation, setSelectedDestinationLocation] = useState(null);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateOrigin(value) {
    setSelectedOriginLocation(null);
    update('origin_airport', value.toUpperCase());
  }

  function updateDestination(value) {
    setSelectedDestinationLocation(null);
    update('destination_airport', value.toUpperCase());
  }

  function selectOriginLocation(location) {
    setSelectedOriginLocation(location);
    update('origin_airport', location.code);
  }

  function selectDestinationLocation(location) {
    setSelectedDestinationLocation(location);
    update('destination_airport', location.code);
  }

  function submit(event) {
    event.preventDefault();
    onSave({
      ...form,
      origin_airport: form.origin_airport.toUpperCase(),
      destination_airport: form.destination_airport.toUpperCase(),
      rate_per_kg: Number(form.rate_per_kg || 0),
      fuel_surcharge: Number(form.fuel_surcharge || 0),
      handling_charge: Number(form.handling_charge || 0)
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Airline" value={form.airline_name} onChange={(e) => update('airline_name', e.target.value)} required />
        <Input label="Rate per kg" type="number" min="0" step="0.01" value={form.rate_per_kg} onChange={(e) => update('rate_per_kg', e.target.value)} required />
        <LocationAutocompleteInput
          label="Origin"
          value={form.origin_airport}
          onChange={updateOrigin}
          onSelect={selectOriginLocation}
          selectionValue="code"
          maxLength={12}
          required
          placeholder="Search city or type code..."
        />
        <LocationAutocompleteInput
          label="Destination"
          value={form.destination_airport}
          onChange={updateDestination}
          onSelect={selectDestinationLocation}
          selectionValue="code"
          maxLength={12}
          required
          placeholder="Search city or type code..."
        />
        <Input label="Fuel surcharge" type="number" min="0" step="0.01" value={form.fuel_surcharge} onChange={(e) => update('fuel_surcharge', e.target.value)} />
        <Input label="Handling charge" type="number" min="0" step="0.01" value={form.handling_charge} onChange={(e) => update('handling_charge', e.target.value)} />
        <Input label="Valid from" type="date" value={form.valid_from} onChange={(e) => update('valid_from', e.target.value)} required />
        <Input label="Valid to" type="date" value={form.valid_to} onChange={(e) => update('valid_to', e.target.value)} required />
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-gray-700">Notes</span>
        <textarea className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} />
      </label>
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save rate
        </Button>
      </div>
    </form>
  );
}

export default function AirlineRates() {
  const [rates, setRates] = useState([]);
  const [filters, setFilters] = useState({ origin: '', destination: '' });
  const [compare, setCompare] = useState({ origin: '', destination: '', weight: 100 });
  const [selectedFilterOriginLocation, setSelectedFilterOriginLocation] = useState(null);
  const [selectedFilterDestinationLocation, setSelectedFilterDestinationLocation] = useState(null);
  const [selectedCompareOriginLocation, setSelectedCompareOriginLocation] = useState(null);
  const [selectedCompareDestinationLocation, setSelectedCompareDestinationLocation] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sortedRates = useMemo(() => rates, [rates]);

  async function loadRates(nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
      const response = await api.get('/rates', { params });
      setRates(response.data.rates);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRates();
  }, []);

  async function saveRate(payload) {
    setSaving(true);
    setError('');
    try {
      if (editing?.id) {
        await api.put(`/rates/${editing.id}`, payload);
      } else {
        await api.post('/rates', payload);
      }
      setEditing(null);
      setCreating(false);
      await loadRates();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRate(rate) {
    if (!window.confirm(`Delete ${rate.airline_name} ${rate.origin_airport}-${rate.destination_airport}?`)) return;
    try {
      await api.delete(`/rates/${rate.id}`);
      await loadRates();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function compareRates() {
    setError('');
    try {
      const response = await api.get('/rates/compare', {
        params: {
          origin: compare.origin,
          destination: compare.destination,
          weight: compare.weight
        }
      });
      setCompareResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function updateFilterOrigin(value) {
    setSelectedFilterOriginLocation(null);
    setFilters((current) => ({ ...current, origin: value.toUpperCase() }));
  }

  function updateFilterDestination(value) {
    setSelectedFilterDestinationLocation(null);
    setFilters((current) => ({ ...current, destination: value.toUpperCase() }));
  }

  function selectFilterOriginLocation(location) {
    setSelectedFilterOriginLocation(location);
    setFilters((current) => ({ ...current, origin: location.code }));
  }

  function selectFilterDestinationLocation(location) {
    setSelectedFilterDestinationLocation(location);
    setFilters((current) => ({ ...current, destination: location.code }));
  }

  function updateCompareOrigin(value) {
    setSelectedCompareOriginLocation(null);
    setCompare((current) => ({ ...current, origin: value.toUpperCase() }));
  }

  function updateCompareDestination(value) {
    setSelectedCompareDestinationLocation(null);
    setCompare((current) => ({ ...current, destination: value.toUpperCase() }));
  }

  function selectCompareOriginLocation(location) {
    setSelectedCompareOriginLocation(location);
    setCompare((current) => ({ ...current, origin: location.code }));
  }

  function selectCompareDestinationLocation(location) {
    setSelectedCompareDestinationLocation(location);
    setCompare((current) => ({ ...current, destination: location.code }));
  }

  async function importCsv() {
    setSaving(true);
    setError('');
    try {
      await api.post('/rates/import', { csvText });
      setCsvText('');
      await loadRates();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Manager"
        description="Internal cargo rates, route comparison, best-rate lookup, and CSV exchange."
        actions={(
          <>
          <Button variant="secondary" icon={Download} onClick={() => downloadFile('/rates/export.csv', 'airline-rates.csv')}>
            Export
          </Button>
          <Button icon={Plane} onClick={() => setCreating(true)}>
            Add rate
          </Button>
          </>
        )}
      />

      {error ? <ErrorState message={error} onRetry={() => loadRates()} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-card">
            <div className="grid gap-3 md:grid-cols-3">
              <LocationAutocompleteInput
                label="Origin"
                value={filters.origin}
                onChange={updateFilterOrigin}
                onSelect={selectFilterOriginLocation}
                selectionValue="code"
                maxLength={12}
                placeholder="Search city or type code..."
              />
              <LocationAutocompleteInput
                label="Destination"
                value={filters.destination}
                onChange={updateFilterDestination}
                onSelect={selectFilterDestinationLocation}
                selectionValue="code"
                maxLength={12}
                placeholder="Search city or type code..."
              />
              <div className="flex items-end">
                <Button icon={Search} onClick={() => loadRates()}>
                  Filter rates
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingState rows={6} />
          ) : sortedRates.length ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Airline</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Rate/kg</th>
                      <th className="px-4 py-3">Fuel</th>
                      <th className="px-4 py-3">Handling</th>
                      <th className="px-4 py-3">Validity</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedRates.map((rate) => (
                      <tr key={rate.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{rate.airline_name}</td>
                        <td className="px-4 py-3">{rate.origin_airport} to {rate.destination_airport}</td>
                        <td className="px-4 py-3">{formatCurrency(rate.rate_per_kg)}</td>
                        <td className="px-4 py-3">{formatCurrency(rate.fuel_surcharge)}</td>
                        <td className="px-4 py-3">{formatCurrency(rate.handling_charge)}</td>
                        <td className="px-4 py-3">{formatDate(rate.valid_from)} - {formatDate(rate.valid_to)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setEditing(rate)} aria-label="Edit rate">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" className="h-9 w-9 px-0 text-red-700 hover:bg-red-50" onClick={() => deleteRate(rate)} aria-label="Delete rate">
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
          ) : (
            <EmptyState title="No airline rates" message="Add an internal rate or import rates from CSV." />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-card">
            <h2 className="text-sm font-semibold text-gray-900">Compare Route Rates</h2>
            <div className="mt-4 grid gap-3">
              <LocationAutocompleteInput
                label="Origin"
                value={compare.origin}
                onChange={updateCompareOrigin}
                onSelect={selectCompareOriginLocation}
                selectionValue="code"
                maxLength={12}
                placeholder="Search city or type code..."
              />
              <LocationAutocompleteInput
                label="Destination"
                value={compare.destination}
                onChange={updateCompareDestination}
                onSelect={selectCompareDestinationLocation}
                selectionValue="code"
                maxLength={12}
                placeholder="Search city or type code..."
              />
              <Input label="Chargeable weight kg" type="number" min="1" value={compare.weight} onChange={(e) => setCompare({ ...compare, weight: e.target.value })} />
              <Button icon={Search} onClick={compareRates}>
                Compare
              </Button>
            </div>
            {compareResult ? (
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                {compareResult.cheapest ? (
                  <>
                    <p className="font-semibold text-gray-900">{compareResult.cheapest.airline_name}</p>
                    <p className="mt-1 text-gray-600">Estimated total {formatCurrency(compareResult.cheapest.total_cost)}</p>
                  </>
                ) : (
                  <p className="text-gray-600">No valid rate found for this route.</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-card">
            <h2 className="text-sm font-semibold text-gray-900">CSV Import</h2>
            <textarea
              className="mt-4 min-h-40 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="airline_name,origin_airport,destination_airport,rate_per_kg,fuel_surcharge,handling_charge,valid_from,valid_to,notes"
            />
            <Button className="mt-3" icon={Upload} loading={saving} onClick={importCsv} disabled={!csvText.trim()}>
              Import CSV
            </Button>
          </div>
        </div>
      </div>

      <Modal title="Add airline rate" open={creating} onClose={() => setCreating(false)}>
        <RateForm onSave={saveRate} saving={saving} />
      </Modal>
      <Modal title="Edit airline rate" open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing ? <RateForm initial={editing} onSave={saveRate} saving={saving} /> : null}
      </Modal>
    </div>
  );
}
