import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Plane, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ErrorState from '../components/common/ErrorState';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../services/authService';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: 'admin@orbem.local', password: 'password' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen items-center gap-10 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(29,158,117,0.27),transparent_30%),linear-gradient(135deg,#081427,#142a52)] p-6 lg:grid-cols-[430px_minmax(0,1fr)] lg:p-14">
      <section className="w-full rounded-lg border border-white/30 bg-white/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#1d9e75]/15 text-[#1d9e75]">
            <Plane className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-[#172033]">ORBEM Operations</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">Air cargo command center for bookings, shipments, documents, revenue, and alerts.</p>
        </div>

        {error ? <div className="mb-4"><ErrorState title="Login failed" message={error} /></div> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <Input label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <Button type="submit" icon={LogIn} loading={loading} className="w-full">
            Login to Dashboard
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-2 text-[#64748b]">
            <ShieldCheck className="h-4 w-4 text-[#1d9e75]" />
            JWT protected admin access
          </span>
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-600">
            Register
          </Link>
        </div>
      </section>

      <section className="hidden items-center gap-8 text-white lg:flex" aria-hidden="true">
        <span className="text-6xl font-black tracking-wide">HYD</span>
        <div className="relative h-1 flex-1 rounded-full bg-[#7dd3c0]">
          <span className="absolute left-[45%] top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#142a52] text-[#7dd3c0]">
            <Plane className="h-7 w-7" />
          </span>
        </div>
        <span className="text-6xl font-black tracking-wide">DXB</span>
      </section>
    </main>
  );
}
