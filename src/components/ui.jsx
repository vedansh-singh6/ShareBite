// ---------------------------------------------------------------------------
// ShareBite design system — reusable primitives used across every page.
// ---------------------------------------------------------------------------
import { forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, Inbox, X, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { classNames, initials } from '../lib/utils';
import { STATUS_META, TASK_STATUS_META } from '../lib/constants';

// ---- Buttons ---------------------------------------------------------------

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};
const SIZES = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={classNames(VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

// ---- Cards & stats -----------------------------------------------------------

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div className={classNames('card', hover && 'card-hover', className)} {...props}>
      {children}
    </div>
  );
}

const STAT_TONES = {
  forest: 'bg-mint text-forest-700',
  peach: 'bg-peach text-orange-700',
  lavender: 'bg-lavender text-violet-700',
  blue: 'bg-blue-50 text-blue-700',
};

export function StatCard({ icon: Icon, label, value, sub, tone = 'forest', delay: d = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: d, duration: 0.35 }}
      className="card flex items-center gap-4 p-5"
    >
      <div className={classNames('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', STAT_TONES[tone])}>
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-charcoal/50">{label}</p>
        <p className="font-display text-2xl font-bold text-charcoal">{value}</p>
        {sub && <p className="truncate text-xs text-charcoal/50">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ---- Badges ------------------------------------------------------------------

const BADGE_TONES = {
  green: 'bg-mint text-forest-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-lavender text-violet-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  teal: 'bg-teal-50 text-teal-700',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-charcoal/5 text-charcoal/60',
};

export function Badge({ tone = 'gray', className, children }) {
  return <span className={classNames('chip', BADGE_TONES[tone], className)}>{children}</span>;
}

export function StatusBadge({ status, task = false, className }) {
  const meta = (task ? TASK_STATUS_META : STATUS_META)[status] || { label: status, tone: 'gray' };
  return (
    <Badge tone={meta.tone} className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </Badge>
  );
}

export function DietBadge({ diet }) {
  return (
    <span
      className={classNames(
        'chip border',
        diet === 'veg'
          ? 'border-forest-200 bg-forest-50 text-forest-700'
          : 'border-red-200 bg-red-50 text-red-600'
      )}
    >
      <span
        className={classNames(
          'flex h-3 w-3 items-center justify-center border',
          diet === 'veg' ? 'border-forest-600' : 'border-red-600'
        )}
      >
        <span className={classNames('h-1.5 w-1.5 rounded-full', diet === 'veg' ? 'bg-forest-600' : 'bg-red-600')} />
      </span>
      {diet === 'veg' ? 'Veg' : 'Non-veg'}
    </span>
  );
}

export function DemoBadge({ className }) {
  return (
    <span className={classNames('chip border border-dashed border-accent/60 bg-peach/50 text-orange-700', className)}>
      Demo data
    </span>
  );
}

// ---- Avatar ------------------------------------------------------------------

export function Avatar({ name, size = 'md', className }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <div
      className={classNames(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display font-bold text-white',
        sizes[size],
        className
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

// ---- Form controls -------------------------------------------------------------

export function Field({ label, error, hint, required, children, htmlFor }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-charcoal/45">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ error, className, ...props }, ref) {
  return <input ref={ref} className={classNames('input', error && 'input-error', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ error, className, ...props }, ref) {
  return (
    <textarea ref={ref} className={classNames('input min-h-[90px] resize-y', error && 'input-error', className)} {...props} />
  );
});

export const Select = forwardRef(function Select({ error, className, children, ...props }, ref) {
  return (
    <select ref={ref} className={classNames('input appearance-none pr-8', error && 'input-error', className)} {...props}>
      {children}
    </select>
  );
});

export function PasswordInput({ error, className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={classNames('input pr-11', error && 'input-error', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-charcoal/40 hover:text-charcoal"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Checkbox({ label, checked, onChange, error, id }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-charcoal/80">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-charcoal/20 text-forest-600 accent-forest-600"
      />
      <span>
        {label}
        {error && (
          <span className="mt-1 block text-xs font-medium text-red-500" role="alert">
            {error}
          </span>
        )}
      </span>
    </label>
  );
}

// ---- Segmented tabs --------------------------------------------------------------

export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={classNames('flex flex-wrap gap-1 rounded-full bg-charcoal/5 p-1', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={active === t.value}
          onClick={() => onChange(t.value)}
          className={classNames(
            'relative rounded-full px-4 py-2 font-display text-sm font-semibold transition-colors',
            active === t.value ? 'text-forest-800' : 'text-charcoal/55 hover:text-charcoal'
          )}
        >
          {active === t.value && (
            <motion.span
              layoutId={`tab-${tabs.map((x) => x.value).join('-')}`}
              className="absolute inset-0 rounded-full bg-white shadow-soft"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative z-10">
            {t.label}
            {typeof t.count === 'number' && (
              <span className="ml-1.5 rounded-full bg-forest-100 px-1.5 py-0.5 text-[10px] font-bold text-forest-700">
                {t.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

// ---- Modal & confirmation ----------------------------------------------------------

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={classNames(
              'relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl',
              wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="font-display text-lg font-bold text-charcoal">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-charcoal/40 hover:bg-charcoal/5 hover:text-charcoal"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3">
        <div
          className={classNames(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            danger ? 'bg-red-50 text-red-500' : 'bg-mint text-forest-600'
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm leading-relaxed text-charcoal/70">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// ---- Loading / empty / error states ---------------------------------------------------

export function Spinner({ className }) {
  return <Loader2 className={classNames('h-6 w-6 animate-spin text-forest-600', className)} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-charcoal/50">
      <Spinner />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal/10 bg-white/60 px-6 py-14 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-forest-600">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display text-base font-bold text-charcoal">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-charcoal/55">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-red-400" />
      <p className="text-sm font-medium text-red-600">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3 p-5">
      <div className="skeleton h-32 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  );
}

// ---- Section heading ------------------------------------------------------------------

export function SectionHeading({ eyebrow, title, subtitle, center = false }) {
  return (
    <div className={classNames('mb-10 max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="mt-3 text-base leading-relaxed text-charcoal/60">{subtitle}</p>}
    </div>
  );
}