import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import ErrorState from '../components/common/ErrorState';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../services/authService';

const roles = [
  'Operations Staff',
  'Documentation Executive',
  'Warehouse Staff',
  'Accounts Staff',
  'Partner Manager',
  'Admin / Owner'
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Operations Staff'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 shadow-card">
        <h1 className="text-xl font-semibold text-gray-950">Create ORBEM user</h1>
        <p className="mt-1 text-sm text-gray-500">Account access is role-aware.</p>
        {error ? <div className="mt-4"><ErrorState title="Registration failed" message={error} /></div> : null}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Password" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Select label="Role" value={form.role} options={roles} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Button type="submit" icon={UserPlus} loading={loading} className="w-full">
            Register
          </Button>
        </form>
        <p className="mt-5 text-sm text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:text-brand-600">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
