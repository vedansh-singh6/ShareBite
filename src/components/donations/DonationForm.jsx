import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ImagePlus, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { Button, Card, Field, Input, Select, Textarea, Checkbox, DietBadge } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as donationService from '../../services/donationService';
import { FOOD_CATEGORIES, UNITS, DIETS, STORAGE_CONDITIONS, FOOD_IMAGES } from '../../lib/constants';
import { toLocalInputValue, fileToDataUrl, classNames } from '../../lib/utils';

const initial = (user) => ({
  foodName: '',
  category: 'cooked_meals',
  diet: 'veg',
  quantity: '',
  unit: 'meals',
  preparedAt: toLocalInputValue(new Date()),
  availableUntil: toLocalInputValue(new Date(Date.now() + 4 * 3600_000)),
  storage: 'hot',
  pickupAddress: user?.address || '',
  instructions: '',
  imageUrl: '',
  safetyDeclared: false,
});

export default function DonationForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => initial(user));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.foodName.trim()) er.foodName = 'Food name is required.';
    else if (form.foodName.trim().length < 3) er.foodName = 'Please enter a descriptive name (min 3 characters).';
    if (!form.quantity || Number(form.quantity) <= 0) er.quantity = 'Enter a quantity greater than 0.';
    else if (Number(form.quantity) > 10000) er.quantity = 'Quantity seems too large — please verify.';
    if (!form.preparedAt) er.preparedAt = 'Preparation time is required.';
    if (!form.availableUntil) er.availableUntil = 'Availability deadline is required.';
    else if (new Date(form.availableUntil) <= new Date(form.preparedAt))
      er.availableUntil = 'Must be after the preparation time.';
    else if (new Date(form.availableUntil) <= new Date())
      er.availableUntil = 'Deadline must be in the future.';
    if (!form.pickupAddress.trim() || form.pickupAddress.trim().length < 10)
      er.pickupAddress = 'Enter a complete pickup address.';
    if (!form.safetyDeclared) er.safetyDeclared = 'You must confirm the food safety declaration.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await fileToDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const donation = await donationService.create(form, user);
      toast(`"${donation.foodName}" is now live for NGOs! 🎉`, 'success');
      navigate('/donor/donations');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <Card className="space-y-5 p-6 lg:col-span-2">
          <h3 className="font-display text-base font-bold text-charcoal">Food Details</h3>
          <Field label="Food name" required error={errors.foodName} htmlFor="foodName">
            <Input
              id="foodName"
              value={form.foodName}
              onChange={set('foodName')}
              placeholder="e.g. Veg Biryani & Raita"
              error={errors.foodName}
              maxLength={90}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" required htmlFor="category">
              <Select id="category" value={form.category} onChange={set('category')}>
                {FOOD_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Food type" required>
              <div className="flex gap-2" role="radiogroup" aria-label="Veg or non-veg">
                {DIETS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    role="radio"
                    aria-checked={form.diet === d.value}
                    onClick={() => set('diet')(d.value)}
                    className={classNames(
                      'flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                      form.diet === d.value
                        ? d.value === 'veg'
                          ? 'border-forest-400 bg-forest-50 text-forest-700 ring-2 ring-forest-200'
                          : 'border-red-300 bg-red-50 text-red-600 ring-2 ring-red-100'
                        : 'border-charcoal/10 bg-white text-charcoal/55 hover:border-charcoal/25'
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Quantity" required error={errors.quantity} htmlFor="quantity">
              <Input
                id="quantity"
                type="number"
                min="1"
                step="any"
                value={form.quantity}
                onChange={set('quantity')}
                placeholder="e.g. 40"
                error={errors.quantity}
              />
            </Field>
            <Field label="Unit" required htmlFor="unit">
              <Select id="unit" value={form.unit} onChange={set('unit')}>
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Prepared at" required error={errors.preparedAt} htmlFor="preparedAt">
              <Input
                id="preparedAt"
                type="datetime-local"
                value={form.preparedAt}
                onChange={set('preparedAt')}
                error={errors.preparedAt}
              />
            </Field>
            <Field
              label="Available until"
              required
              error={errors.availableUntil}
              htmlFor="availableUntil"
              hint="NGOs and volunteers must collect before this time."
            >
              <Input
                id="availableUntil"
                type="datetime-local"
                value={form.availableUntil}
                onChange={set('availableUntil')}
                error={errors.availableUntil}
              />
            </Field>
          </div>
          <Field label="Storage conditions" required htmlFor="storage">
            <Select id="storage" value={form.storage} onChange={set('storage')}>
              {STORAGE_CONDITIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pickup address" required error={errors.pickupAddress} htmlFor="pickupAddress">
            <Textarea
              id="pickupAddress"
              value={form.pickupAddress}
              onChange={set('pickupAddress')}
              placeholder="Building, street, area, city, PIN"
              error={errors.pickupAddress}
              rows={2}
            />
          </Field>
          <Field label="Additional instructions" htmlFor="instructions" hint="Optional — packing, entry gate, contact person…">
            <Textarea
              id="instructions"
              value={form.instructions}
              onChange={set('instructions')}
              placeholder="e.g. Collect from the back entrance, ask for Rohit."
              rows={2}
            />
          </Field>
        </Card>

        {/* Image + safety */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-display text-base font-bold text-charcoal">Food Image</h3>
            <div className="relative mb-4 h-40 overflow-hidden rounded-2xl bg-mint">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Food preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-forest-400">
                  <UtensilsCrossed className="h-8 w-8" />
                  <p className="text-xs font-medium">No image selected</p>
                </div>
              )}
            </div>
            <label className="btn-secondary btn-md w-full cursor-pointer">
              <Upload className="h-4 w-4" />
              {uploading ? 'Processing…' : 'Upload photo'}
              <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
            </label>
            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal/45">
              Or pick a stock photo
            </p>
            <div className="grid grid-cols-4 gap-2">
              {FOOD_IMAGES.slice(0, 8).map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: url }))}
                  className={classNames(
                    'h-12 overflow-hidden rounded-lg border-2 transition-all',
                    form.imageUrl === url ? 'border-forest-500 ring-2 ring-forest-200' : 'border-transparent opacity-80 hover:opacity-100'
                  )}
                  aria-label="Use this stock photo"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-forest-100 bg-mint/40 p-6">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-forest-600" />
              <h3 className="font-display text-base font-bold text-charcoal">Food Safety Declaration</h3>
            </div>
            <Checkbox
              id="safety"
              checked={form.safetyDeclared}
              onChange={(v) => {
                setForm((f) => ({ ...f, safetyDeclared: v }));
                setErrors((er) => ({ ...er, safetyDeclared: undefined }));
              }}
              error={errors.safetyDeclared}
              label="I declare this food was prepared hygienically, is fit for human consumption, and has been stored under the conditions stated above."
            />
          </Card>

          <motion.div whileTap={{ scale: 0.99 }}>
            <Button type="submit" size="lg" className="w-full" loading={submitting} icon={ImagePlus}>
              Publish Donation
            </Button>
          </motion.div>
        </div>
      </div>
    </form>
  );
}