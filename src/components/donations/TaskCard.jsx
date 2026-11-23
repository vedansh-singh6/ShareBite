import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowDown, Clock, Package, Truck, CheckCircle2, HandHeart, Phone } from 'lucide-react';
import { Card, StatusBadge, DietBadge, Button, ConfirmDialog, Badge } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { useData, useLookups } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import * as taskService from '../../services/taskService';
import { TASK_STATUS } from '../../lib/constants';
import { formatQuantity, timeLeft, timeAgo, classNames } from '../../lib/utils';

/**
 * Mobile-first collection task card with the next workflow action always
 * visible as a large button — no hunting through menus.
 */
export default function TaskCard({ task, index = 0, onOpenDonation }) {
  const { user } = useAuth();
  const { donations } = useData();
  const { userById } = useLookups();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const donation = donations.find((d) => d.id === task.donationId);
  if (!donation) return null;
  const donor = userById(donation.donorId);
  const ngo = userById(donation.acceptedBy);
  const left = timeLeft(donation.availableUntil);
  const isMine = task.volunteerId === user.id;

  let action = null;
  if (task.status === TASK_STATUS.OPEN) {
    action = {
      label: 'Accept Collection Task',
      icon: HandHeart,
      title: 'Take this task?',
      message: `Pick up ${formatQuantity(donation.quantity, donation.unit)} of "${donation.foodName}" from ${donor?.orgName || 'the donor'} and deliver to ${ngo?.orgName || 'the NGO'}.`,
      run: () => taskService.acceptTask(task.id, user),
      success: 'Task accepted! Head to the pickup point. 🚴',
    };
  } else if (isMine && task.status === TASK_STATUS.ASSIGNED) {
    action = {
      label: 'Confirm Pickup',
      icon: Package,
      title: 'Confirm pickup?',
      message: 'Confirm you collected the food from the donor and it is in safe condition.',
      run: () => taskService.confirmPickup(task.id, user),
      success: 'Pickup confirmed. Now deliver to the NGO.',
    };
  } else if (isMine && task.status === TASK_STATUS.PICKED_UP) {
    action = {
      label: 'Confirm Delivery',
      icon: CheckCircle2,
      title: 'Confirm delivery?',
      message: `Confirm you handed the food over to ${ngo?.orgName || 'the NGO'}.`,
      run: () => taskService.confirmDelivery(task.id, user),
      success: 'Delivery confirmed! The NGO will confirm receipt. 🎉',
    };
  }

  const runAction = async () => {
    setBusy(true);
    try {
      await action.run();
      toast(action.success, 'success');
      setConfirm(null);
    } catch (err) {
      toast(err.message, 'error');
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.35 }}
    >
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-charcoal/5 p-4">
          <button
            onClick={() => onOpenDonation?.(donation.id)}
            className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mint"
            aria-label={`View ${donation.foodName} details`}
          >
            {donation.imageUrl && <img src={donation.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
          </button>
          <div className="min-w-0 flex-1">
            <button
              onClick={() => onOpenDonation?.(donation.id)}
              className="block w-full truncate text-left font-display text-sm font-bold text-charcoal hover:text-forest-700"
            >
              {donation.foodName}
            </button>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone="green">{formatQuantity(donation.quantity, donation.unit)}</Badge>
              <DietBadge diet={donation.diet} />
            </div>
          </div>
          <StatusBadge status={task.status} task />
        </div>

        {/* Route: pickup → delivery */}
        <div className="space-y-0 p-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-forest-600">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span className="my-1 w-0.5 flex-1 bg-charcoal/10" aria-hidden="true" />
            </div>
            <div className="min-w-0 pb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal/45">
                Pickup · {donor?.orgName || donor?.name}
              </p>
              <p className="text-sm text-charcoal/75">{task.pickupAddress}</p>
              {donor?.phone && (
                <a href={`tel:${donor.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-forest-600">
                  <Phone className="h-3 w-3" /> {donor.phone}
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-peach text-orange-600">
              <ArrowDown className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal/45">
                Deliver to · {ngo?.orgName || 'NGO'}
              </p>
              <p className="text-sm text-charcoal/75">{task.deliveryAddress}</p>
              {ngo?.phone && (
                <a href={`tel:${ngo.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-forest-600">
                  <Phone className="h-3 w-3" /> {ngo.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-charcoal/5 px-4 py-3">
          <p
            className={classNames(
              'flex items-center gap-1.5 text-xs font-semibold',
              task.status === TASK_STATUS.COMPLETED
                ? 'text-charcoal/45'
                : left.expired
                  ? 'text-red-500'
                  : left.urgent
                    ? 'text-orange-600'
                    : 'text-forest-600'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {task.status === TASK_STATUS.COMPLETED
              ? `Completed ${timeAgo(task.updatedAt)}`
              : left.text}
          </p>
          {task.demo && <span className="text-[10px] font-bold uppercase tracking-wide text-orange-500">Demo</span>}
        </div>

        {action && (
          <div className="p-4 pt-1">
            <Button size="lg" icon={action.icon} className="w-full" onClick={() => setConfirm(action)}>
              {action.label}
            </Button>
          </div>
        )}
        {isMine && task.status === TASK_STATUS.DELIVERED && (
          <div className="mx-4 mb-4 rounded-xl bg-mint/60 px-4 py-3 text-center text-sm font-medium text-forest-700">
            ✅ Delivered — waiting for the NGO to confirm receipt.
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => !busy && setConfirm(null)}
        onConfirm={runAction}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.label || 'Confirm'}
        loading={busy}
      />
    </motion.div>
  );
}