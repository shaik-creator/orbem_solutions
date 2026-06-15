import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { bookingService } from '../services/bookingService';
import BookingForm from '../components/bookings/BookingForm';
import ErrorState from '../components/common/ErrorState';
import PageHeader from '../components/common/PageHeader';

export default function BookingCreate() {
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/summary').then((response) => setOwners(response.data.owners || [])).catch(() => setOwners([]));
  }, []);

  async function createBooking(payload) {
    setSaving(true);
    setError('');
    try {
      const response = await bookingService.create(payload);
      navigate(`/bookings/${response.booking.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Booking" description="Create a shipment record with document, payment, route, cargo, and owner tracking." statusText="New shipment intake" />
      {error ? <ErrorState message={error} /> : null}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <BookingForm owners={owners} onSubmit={createBooking} submitting={saving} submitLabel="Create booking" />
      </div>
    </div>
  );
}
