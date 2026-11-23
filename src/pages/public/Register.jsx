import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, HeartHandshake, Bike, UserPlus, ArrowLeft } from 'lucide-react';
import Logo from '../../components/layout/Logo';
import { Button, Card, Field, Input, PasswordInput, Select } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES, ROLE_HOME, DONOR_TYPES } from '../../lib/constants';
import { classNames } from '../../lib/utils';

const ROLE_CARDS = [
  { value: ROLES.DONOR, label: 'Donor', icon: UtensilsCrossed, desc: 'I have surplus food to give' },
  { value: ROLES.NGO, label: 'NGO', icon: HeartHandshake, desc: 'We receive & redistribute food' },
  { value: ROLES.VOLUNTEER, label: 'Volunteer', icon: Bike, desc: 'I can collect & deliver food' },
];

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = ROLE_CARDS.some((r) => r.value === params.get('role')) ? params.get('role') : ROLES.DONOR;

  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', phone: '',
    orgName: '', address: '', donorType: 'restaurant',
    registrationNumber: '', area: '', vehicle: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Your name is required.';
    if (!form.email.trim()) er.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email address.';
    if (!form.password) er.password = 'Password is required.';
    else if (form.password.length < 8) er.password = 'Use at least 8 characters.';
    if (form.confirm !== form.password) er.confirm = 'Passwords do not match.';
    if (form.phone && !/^[\d+\-\s()]{7,16}$/.test(form.phone)) er.phone = 'Enter a valid phone number.';
    if (role === ROLES.DONOR && !form.orgName.trim()) er.orgName = 'Organisation / kitchen name is required.';
    if (role === ROLES.NGO) {
      if (!form.orgName.trim()) er.orgName = 'NGO name is required.';
      if (!form.address.trim()) er.address = 'Delivery address is required.';
    }
    if (role !== ROLES.VOLUNTEER && !form.address.trim()) er.address = 'Address is required.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setServerError('');
    try {
      const user = await register({ ...form, role });
      toast(
        role === ROLES.NGO
          ? 'Account created! An admin will verify your NGO before you can accept donations.'
          : `Welcome to ShareBite, ${user.name.split(' ')[0]}!`,
        'success',
        6000
      );
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient py-12">
      <div className="container-page flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-xl"
        >
          <div className="mb-8 flex justify-center"><Logo /></div>
          <Card className="p-8">
            <h1 className="font-display text-2xl font-extrabold text-charcoal">Create your account</h1>
            <p className="mt-1 text-sm text-charcoal/55">Join the movement to give good food a second chance.</p>

            <div className="mt-6">
              <p className="label">I am joining as a…</p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select role">
                {ROLE_CARDS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    role="radio"
                    aria-checked={role === r.value}
                    onClick={() => setRole(r.value)}
                    className={classNames(
                      'rounded-2xl border p-3 text-center transition-all',
                      role === r.value
                        ? 'border-forest-400 bg-forest-50 ring-2 ring-forest-200'
                        : 'border-charcoal/10 bg-white hover:border-charcoal/25'
                    )}
                  >
                    <r.icon className={classNames('mx-auto mb-1.5 h-5 w-5', role === r.value ? 'text-forest-600' : 'text-charcoal/40')} />
                    <span className="block font-display text-sm font-bold text-charcoal">{r.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-charcoal/50">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {serverError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required error={errors.name} htmlFor="name">
                  <Input id="name" value={form.name} onChange={set('name')} placeholder="Your name" error={errors.name} autoComplete="name" />
                </Field>
                <Field label="Phone" error={errors.phone} htmlFor="phone" hint="Optional">
                  <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="+91…" error={errors.phone} autoComplete="tel" />
                </Field>
              </div>

              {(role === ROLES.DONOR || role === ROLES.NGO) && (
                <Field
                  label={role === ROLES.NGO ? 'NGO name' : 'Organisation / kitchen name'}
                  required
                  error={errors.orgName}
                  htmlFor="orgName"
                >
                  <Input id="orgName" value={form.orgName} onChange={set('orgName')} placeholder={role === ROLES.NGO ? 'e.g. Annapurna Foundation' : 'e.g. Spice Garden Restaurant'} error={errors.orgName} />
                </Field>
              )}

              {role === ROLES.DONOR && (
                <Field label="Donor type" htmlFor="donorType">
                  <Select id="donorType" value={form.donorType} onChange={set('donorType')}>
                    {DONOR_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </Select>
                </Field>
              )}

              {role === ROLES.NGO && (
                <Field label="Registration number" htmlFor="regNo" hint="Optional — helps admins verify your NGO faster.">
                  <Input id="regNo" value={form.registrationNumber} onChange={set('registrationNumber')} placeholder="e.g. KA/NGO/2024/00123" />
                </Field>
              )}

              {role === ROLES.VOLUNTEER && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your area" htmlFor="area" hint="Where you can collect">
                    <Input id="area" value={form.area} onChange={set('area')} placeholder="e.g. Koramangala" />
                  </Field>
                  <Field label="Vehicle" htmlFor="vehicle" hint="Optional">
                    <Input id="vehicle" value={form.vehicle} onChange={set('vehicle')} placeholder="e.g. Two-wheeler" />
                  </Field>
                </div>
              )}

              {role !== ROLES.VOLUNTEER && (
                <Field label={role === ROLES.NGO ? 'Delivery address' : 'Pickup address'} required error={errors.address} htmlFor="address">
                  <Input id="address" value={form.address} onChange={set('address')} placeholder="Street, area, city, PIN" error={errors.address} />
                </Field>
              )}

              <Field label="Email" required error={errors.email} htmlFor="regEmail">
                <Input id="regEmail" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" error={errors.email} autoComplete="email" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password" required error={errors.password} htmlFor="regPassword" hint="Min 8 characters">
                  <PasswordInput id="regPassword" value={form.password} onChange={set('password')} placeholder="••••••••" error={errors.password} autoComplete="new-password" />
                </Field>
                <Field label="Confirm password" required error={errors.confirm} htmlFor="regConfirm">
                  <PasswordInput id="regConfirm" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" error={errors.confirm} autoComplete="new-password" />
                </Field>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={busy} icon={UserPlus}>
                Create account
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-charcoal/55">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-forest-600 hover:text-forest-700">Log in</Link>
            </p>
          </Card>
          <p className="mt-6 text-center text-xs text-charcoal/40">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-forest-600"><ArrowLeft className="h-3 w-3" /> Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}