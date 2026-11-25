import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UtensilsCrossed, HeartHandshake, Bike, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../../components/layout/Logo';
import { Button, Card, Field, Input, PasswordInput, DemoBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLE_HOME } from '../../lib/constants';


const DEMO_ACCOUNTS = [
  { role: 'Admin', name: 'ShareBite Admin', email: 'admin@sharebite.demo', password: 'Admin@123', icon: ShieldCheck, desc: 'Full platform access' },
  { role: 'Food Donor', name: 'Rahul Sharma', email: 'donor@sharebite.demo', password: 'Donor@123', icon: UtensilsCrossed, desc: "Rahul's Kitchen" },
  { role: 'NGO', name: 'Helping Hands NGO', email: 'ngo@sharebite.demo', password: 'Ngo@123', icon: HeartHandshake, desc: 'Helping Hands NGO' },
  { role: 'Volunteer', name: 'Arjun Kumar', email: 'volunteer@sharebite.demo', password: 'Volunteer@123', icon: Bike, desc: 'Indiranagar / Koramangala' },
];

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const er = {};
    if (!form.email.trim()) er.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email address.';
    if (!form.password) er.password = 'Password is required.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const doLogin = async (email, password) => {
    setBusy(true);
    setServerError('');
    try {
      const user = await login(email, password);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      navigate(location.state?.from || ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    doLogin(form.email, form.password);
  };

  return (
    <div className="flex min-h-screen bg-hero-gradient">
      <div className="container-page flex flex-1 items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex justify-center"><Logo /></div>
          <Card className="p-8">
            <h1 className="font-display text-2xl font-extrabold text-charcoal">Welcome back</h1>
            <p className="mt-1 text-sm text-charcoal/55">Log in to continue redistributing good food.</p>

            {serverError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <Field label="Email" required error={errors.email} htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((er) => ({ ...er, email: undefined })); }}
                  error={errors.email}
                />
              </Field>
              <Field label="Password" required error={errors.password} htmlFor="password">
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setErrors((er) => ({ ...er, password: undefined })); }}
                  error={errors.password}
                />
              </Field>
              <Button type="submit" className="w-full" size="lg" loading={busy} icon={LogIn}>
                Log in
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-charcoal/55">
              New to ShareBite?{' '}
              <Link to="/register" className="font-semibold text-forest-600 hover:text-forest-700">Create an account</Link>
            </p>
          </Card>

          <Card className="mt-5 p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-display text-sm font-bold text-charcoal">
                <Sparkles className="h-4 w-4 text-accent" /> Explore Demo Accounts
              </p>
              <DemoBadge />
            </div>
            <p className="mb-4 text-xs text-charcoal/50">
              Click any account to log in instantly. Credentials are also shown for manual entry.
            </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <div
                    key={a.role}
                    className="rounded-xl border border-charcoal/10 bg-white p-3"
                  >
                    <div className="mb-2 flex items-center gap-2.5">
                      <a.icon className="h-4 w-4 shrink-0 text-forest-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-charcoal">{a.role} — {a.name}</p>
                        <p className="text-[11px] text-charcoal/50">{a.desc}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard?.writeText(a.email); toast(`Email copied: ${a.email}`, 'success'); }}
                        className="flex items-center justify-between gap-2 rounded-lg border border-charcoal/10 bg-cream px-3 py-1.5 text-xs transition-colors hover:border-forest-300"
                      >
                        <span className="truncate font-mono text-charcoal/80">{a.email}</span>
                        <span className="shrink-0 font-semibold text-forest-600">Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard?.writeText(a.password); toast('Password copied.', 'success'); }}
                        className="flex items-center justify-between gap-2 rounded-lg border border-charcoal/10 bg-cream px-3 py-1.5 text-xs transition-colors hover:border-forest-300"
                      >
                        <span className="truncate font-mono text-charcoal/80">{a.password}</span>
                        <span className="shrink-0 font-semibold text-forest-600">Copy</span>
                      </button>
                    </div>
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      loading={busy}
                      onClick={() => doLogin(a.email, a.password)}
                    >
                      Login as {a.role}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

          <p className="mt-6 text-center text-xs text-charcoal/40">
            <Link to="/" className="hover:text-forest-600">← Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}