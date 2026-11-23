// ---------------------------------------------------------------------------
// Shared donation detail modal — the single place where workflow actions are
// offered, role-aware. Used by donor, NGO, volunteer and admin dashboards so
// the status pipeline behaves identically everywhere.
// ---------------------------------------------------------------------------
import { useState, useEffect } from 'react';
import * as matchingService from '../../services/matchingService';
import {
  MapPin, Clock, ChefHat, Snowflake, Flame, Package, ShieldCheck,
  HandHeart, Truck, CheckCircle2, XCircle, Ban, Building2, User, Phone,
} from 'lucide-react';
import { Modal, ConfirmDialog, Button, StatusBadge, DietBadge, Badge, DemoBadge } from '../ui';
import StatusTimeline from './StatusTimeline';
import MapView, { openInMaps } from '../map/MapView';
import { useAuth } from '../../context/AuthContext';
import { useData, useLookups } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import * as donationService from '../../services/donationService';
import * as taskService from '../../services/taskService';
import { STATUS, TASK_STATUS, CATEGORY_LABELS, STORAGE_LABELS } from '../../lib/constants';
import { formatQuantity, formatDateTime, timeLeft } from '../../lib/utils';

const STORAGE_ICONS = { hot: Flame, room_temp: Package, refrigerated: Snowflake };

export default function DonationDetailModal({ donationId, open, onClose }) {
  const { user } = useAuth();
  const { donations, tasks } = useData();
  const { userById } = useLookups();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(null); // { action, title, message, label, danger }
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState('');

  useEffect(() => {
    if (!open || !donationId) return;
    const d = donations.find((x) => x.id === donationId);
    if (!d || d.status !== STATUS.PENDING) {
      setMatches(null);
      setMatchesError('');
      return;
    }
    let cancelled = false;
    setMatchesLoading(true);
    setMatchesError('');
    matchingService
      .getMatchesForDonation(donationId)
      .then((res) => { if (!cancelled) setMatches(res); })
      .catch((err) => { if (!cancelled) setMatchesError(err.message); })
      .finally(() => { if (!cancelled) setMatchesLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, donationId]);

  const donation = donations.find((d) => d.id === donationId);
  if (!donation) return null;

  const donor = userById(donation.donorId);
  const ngo = userById(donation.acceptedBy);
  const volunteer = userById(donation.volunteerId);
  const task = tasks.find((t) => t.id === donation.taskId);
  const left = timeLeft(donation.availableUntil);
  const StorageIcon = STORAGE_ICONS[donation.storage] || Package;

  // ---- Role-aware available actions ----------------------------------------
  const actions = [];
  if (user.role === 'donor' && donation.donorId === user.id) {
    if ([STATUS.PENDING, STATUS.ACCEPTED, STATUS.VOLUNTEER_ASSIGNED].includes(donation.status)) {
      actions.push({
        key: 'cancel',
        label: 'Cancel Donation',
        icon: Ban,
        variant: 'danger',
        danger: true,
        title: 'Cancel this donation?',
        message: 'The donation will be withdrawn and any assigned volunteer will be notified. This cannot be undone.',
        run: () => donationService.cancel(donation.id, user),
        success: 'Donation cancelled.',
      });
    }
  }
  if (user.role === 'ngo') {
    const canAct =
      donation.status === STATUS.PENDING &&
      !left.expired &&
      !(donation.rejectedBy || []).includes(user.id);
    if (canAct) {
      actions.push({
        key: 'accept',
        label: 'Accept Donation',
        icon: HandHeart,
        variant: 'primary',
        title: 'Accept this donation?',
        message: `You commit to receiving ${formatQuantity(donation.quantity, donation.unit)} of "${donation.foodName}". A collection task will be created for volunteers.`,
        run: () => donationService.accept(donation.id, user),
        success: 'Donation accepted! Volunteers have been notified.',
      });
      actions.push({
        key: 'reject',
        label: 'Decline',
        icon: XCircle,
        variant: 'secondary',
        danger: true,
        title: 'Decline this donation?',
        message: 'It will be hidden from your available list but remain visible to other NGOs.',
        run: () => donationService.reject(donation.id, user),
        success: 'Donation declined.',
      });
    }
    if (donation.acceptedBy === user.id && donation.status === STATUS.DELIVERED) {
      actions.push({
        key: 'receipt',
        label: 'Confirm Receipt',
        icon: CheckCircle2,
        variant: 'primary',
        title: 'Confirm food receipt?',
        message: 'Confirm that the food has physically reached your organisation. This completes the donation.',
        run: () => donationService.confirmReceipt(donation.id, user),
        success: 'Receipt confirmed — donation completed! 🎉',
      });
    }
  }
  if (user.role === 'volunteer' && task) {
    if (task.status === TASK_STATUS.OPEN) {
      actions.push({
        key: 'take',
        label: 'Accept Collection Task',
        icon: Truck,
        variant: 'primary',
        title: 'Take this collection task?',
        message: `Pick up from ${donor?.orgName || 'the donor'} and deliver to ${ngo?.orgName || 'the NGO'}.`,
        run: () => taskService.acceptTask(task.id, user),
        success: 'Task accepted. Head to the pickup location!',
      });
    }
    if (task.volunteerId === user.id && task.status === TASK_STATUS.ASSIGNED) {
      actions.push({
        key: 'pickup',
        label: 'Confirm Pickup',
        icon: Package,
        variant: 'primary',
        title: 'Confirm pickup?',
        message: 'Confirm you have collected the food from the donor and it is in safe condition.',
        run: () => taskService.confirmPickup(task.id, user),
        success: 'Pickup confirmed. Deliver to the NGO.',
      });
    }
    if (task.volunteerId === user.id && task.status === TASK_STATUS.PICKED_UP) {
      actions.push({
        key: 'deliver',
        label: 'Confirm Delivery',
        icon: CheckCircle2,
        variant: 'primary',
        title: 'Confirm delivery?',
        message: `Confirm the food was handed over to ${ngo?.orgName || 'the NGO'}. They will then confirm receipt.`,
        run: () => taskService.confirmDelivery(task.id, user),
        success: 'Delivery confirmed! Awaiting NGO receipt.',
      });
    }
  }

  const runAction = async (action) => {
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

  const infoRows = [
    { icon: ChefHat, label: 'Prepared', value: formatDateTime(donation.preparedAt) },
    { icon: Clock, label: 'Available until', value: `${formatDateTime(donation.availableUntil)} (${left.text})` },
    { icon: StorageIcon, label: 'Storage', value: STORAGE_LABELS[donation.storage] || donation.storage },
    { icon: MapPin, label: 'Pickup address', value: donation.pickupAddress },
  ];

  return (
    <>
      <Modal open={open && !confirm} onClose={onClose} title="Donation Details" wide>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="relative mb-4 h-44 overflow-hidden rounded-2xl bg-mint">
              {donation.imageUrl ? (
                <img src={donation.imageUrl} alt={donation.foodName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-forest-300">
                  <ChefHat className="h-10 w-10" />
                </div>
              )}
              <div className="absolute left-3 top-3">
                <StatusBadge status={donation.status} />
              </div>
            </div>
            <h4 className="font-display text-lg font-bold text-charcoal">{donation.foodName}</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <DietBadge diet={donation.diet} />
              <Badge tone="gray">{CATEGORY_LABELS[donation.category]}</Badge>
              <Badge tone="green">{formatQuantity(donation.quantity, donation.unit)}</Badge>
              {donation.demo && <DemoBadge />}
            </div>
            <dl className="mt-4 space-y-3">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start gap-2.5 text-sm">
                  <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">{row.label}</dt>
                    <dd className="text-charcoal/80">{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            {donation.instructions && (
              <div className="mt-4 rounded-xl bg-peach/40 p-3 text-sm text-charcoal/75">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-orange-700">Donor instructions</p>
                {donation.instructions}
              </div>
            )}
            {donation.safetyDeclared && (
              <p className="mt-4 flex items-center gap-2 text-xs font-medium text-forest-700">
                <ShieldCheck className="h-4 w-4" /> Donor declared the food safe for consumption.
              </p>
            )}

            {donation.status === STATUS.PENDING && (
              <div className="mt-5 rounded-2xl border border-charcoal/5 bg-cream/60 p-4">
                <p className="mb-3 font-display text-sm font-bold text-charcoal">Recommended NGOs (by distance)</p>
                {matchesLoading && <p className="text-xs text-charcoal/50">Finding nearby NGOs…</p>}
                {matchesError && <p className="text-xs font-medium text-red-500">{matchesError}</p>}
                {!matchesLoading && !matchesError && matches && matches.length === 0 && (
                  <p className="text-xs text-charcoal/55">No verified NGO is currently within range for this donation.</p>
                )}
                {!matchesLoading && matches && matches.length > 0 && (
                  <ul className="space-y-2">
                    {matches.map((m) => (
                      <li key={m.ngo.id} className="flex items-start justify-between gap-3 rounded-xl bg-white p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-charcoal">{m.ngo.orgName}</p>
                          <p className="text-xs text-charcoal/50">{m.distanceKm} km away</p>
                          <p className="mt-1 text-[11px] text-charcoal/45">{m.reasons.join(' · ')}</p>
                        </div>
                        <span className="chip bg-mint text-forest-700">{m.ngo.verified ? 'Verified' : 'Unverified'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 space-y-2">
              {[
                { icon: User, label: 'Donor', person: donor },
                { icon: Building2, label: 'Receiving NGO', person: ngo },
                { icon: Truck, label: 'Volunteer', person: volunteer },
              ]
                .filter((x) => x.person)
                .map((x) => (
                  <div key={x.label} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                    <x.icon className="h-4 w-4 shrink-0 text-forest-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal/45">{x.label}</p>
                      <p className="truncate text-sm font-semibold text-charcoal">
                        {x.person.orgName || x.person.name}
                      </p>
                      {x.person.phone && (
                        <p className="flex items-center gap-1 text-xs text-charcoal/50">
                          <Phone className="h-3 w-3" /> {x.person.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              {ngo?.address && donation.status !== STATUS.PENDING && (
                <p className="flex items-start gap-2 px-1 text-xs text-charcoal/55">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-500" />
                  Delivery: {ngo.address}
                </p>
              )}
            </div>
            {(Number.isFinite(donation.pickupLatitude) && Number.isFinite(donation.pickupLongitude)) && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-display text-sm font-bold text-charcoal">Location & route</p>
                  <button
                    type="button"
                    onClick={() => openInMaps(donation.pickupLatitude, donation.pickupLongitude, donation.foodName)}
                    className="text-xs font-semibold text-forest-600 hover:text-forest-700"
                  >
                    Open in maps ↗
                  </button>
                </div>
                <MapView
                  height={220}
                  markers={[
                    { lat: donation.pickupLatitude, lon: donation.pickupLongitude, type: 'pickup', popup: `Pickup: ${donation.pickupAddress}` },
                    ...(ngo && Number.isFinite(ngo.latitude) && Number.isFinite(ngo.longitude)
                      ? [{ lat: ngo.latitude, lon: ngo.longitude, type: 'delivery', popup: `Delivery: ${ngo.orgName}` }]
                      : []),
                    ...(donation.status === STATUS.PENDING && matches
                      ? matches.map((m) => ({ lat: m.ngo.latitude, lon: m.ngo.longitude, type: 'ngo', popup: `${m.ngo.orgName} (${m.distanceKm} km)` }))
                      : []),
                  ]}
                  route={
                    ngo && Number.isFinite(ngo.latitude) && Number.isFinite(ngo.longitude) && donation.status !== STATUS.PENDING
                      ? [[donation.pickupLatitude, donation.pickupLongitude], [ngo.latitude, ngo.longitude]]
                      : []
                  }
                />
              </div>
            )}
            <div className="rounded-2xl border border-charcoal/5 p-4">
              <p className="mb-3 font-display text-sm font-bold text-charcoal">Progress</p>
              <StatusTimeline donation={donation} />
            </div>
          </div>
        </div>

        {actions.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-charcoal/5 pt-4">
            {actions.map((a) => (
              <Button key={a.key} variant={a.variant} icon={a.icon} onClick={() => setConfirm(a)}>
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => !busy && setConfirm(null)}
        onConfirm={() => confirm && runAction(confirm)}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.label || 'Confirm'}
        danger={confirm?.danger}
        loading={busy}
      />
    </>
  );
}