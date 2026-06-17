import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, LogIn, Mail, PlaneTakeoff, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ErrorState from '../components/common/ErrorState';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../services/authService';

const demoUsers = [
  { email: 'admin@orbem.local', role: 'Admin - full access', initials: 'AK', color: '#1d9e75' },
  { email: 'ops@orbem.local', role: 'Operations staff', initials: 'RM', color: '#378add' },
  { email: 'accounts@orbem.local', role: 'Accounts & payments', initials: 'SP', color: '#ef9f27' }
];

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
    <main className="flex min-h-screen items-center justify-center bg-[#edf2f7] p-4 sm:p-6">
      <section className="grid min-h-[580px] w-full max-w-5xl overflow-hidden rounded-[18px] border border-[#dbe3ea] bg-white shadow-[0_26px_70px_rgba(15,31,61,0.16)] lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[#0f1f3d] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#1d9e75]">
                <PlaneTakeoff className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-semibold">ORBEM</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Solutions Pvt Ltd</p>
              </div>
            </div>

            <div className="my-auto max-w-sm">
              <h1 className="text-[28px] font-semibold leading-tight">
                Air cargo ops,
                <br />
                <span className="text-[#1d9e75]">fully in control.</span>
              </h1>
              <p className="mt-4 max-w-[300px] text-sm leading-7 text-white/55">
                Real-time shipment tracking, revenue intelligence, and document management built for daily logistics operations.
              </p>
              <div className="mt-9 flex gap-7">
                {[
                  ['247', 'Active bookings'],
                  ['14', 'Departures today'],
                  ['48L', 'Revenue MTD']
                ].map(([value, label]) => (
                  <div key={label} className="border-l-2 border-white/10 pl-4">
                    <p className="text-xl font-semibold">{value}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/35">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-white/25">(c) 2026 ORBEM Solutions Private Limited</p>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-7 lg:hidden">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d9e75] text-white">
                <PlaneTakeoff className="h-5 w-5" />
              </div>
              <p className="text-xl font-semibold text-[#0f1f3d]">ORBEM Operations</p>
            </div>

            <div className="mb-7">
              <h2 className="text-xl font-semibold text-[#172033]">Sign in</h2>
              <p className="mt-1 text-sm text-[#64748b]">Access your operations dashboard</p>
            </div>

            {error ? <div className="mb-4"><ErrorState title="Login failed" message={error} /></div> : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Input label="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                <Mail className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-[#94a3b8]" />
              </div>
              <div className="relative">
                <Input label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                <Eye className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-[#94a3b8]" />
              </div>
              <div className="-mt-1 text-right">
                <Link to="/register" className="text-xs font-semibold text-[#1d9e75] hover:text-[#0f6e56]">Create account</Link>
              </div>
              <Button type="submit" icon={LogIn} loading={loading} className="w-full bg-[#0f1f3d] hover:bg-[#1a3258]">
                Sign in to dashboard
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[11px] text-[#94a3b8]">
              <span className="h-px flex-1 bg-[#edf2f7]" />
              or sign in as a demo user
              <span className="h-px flex-1 bg-[#edf2f7]" />
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94a3b8]">Quick access</p>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => setForm({ email: user.email, password: 'password' })}
                  className="flex w-full items-center gap-3 rounded-lg border border-[#dbe3ea] bg-[#f8fafc] px-3 py-2 text-left transition hover:border-[#cbd5e1] hover:bg-white"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: user.color }}>
                    {user.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[#172033]">{user.email}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-[#94a3b8]">{user.role}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#94a3b8]" />
                </button>
              ))}
            </div>

            <p className="mt-5 inline-flex items-center gap-2 text-xs text-[#64748b]">
              <ShieldCheck className="h-4 w-4 text-[#1d9e75]" />
              JWT protected demo access
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
