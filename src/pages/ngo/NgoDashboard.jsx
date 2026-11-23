import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, HeartHandshake, PackageCheck, Clock3, CheckCircle2, ArrowRight, ShieldAlert, Inbox } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, Card, Button, EmptyState, StatusBadge } from '../../components/ui';
import DonationCard from '../../components/donations/DonationCard';
import DonationDetailModal from '../../components/donations/DonationDetailModal';

import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import * as authService from '../../services/authService';
import * as matchingService from '../../services/matchingService';
import { ngoStats } from '../../lib/stats';
import { STATUS, FOOD_CATEGORIES } from '../../lib/constants';
import { formatQuantity, timeAgo } from '../../lib/utils';
export const NGO_NAV = [
  { to: '/ngo', label: 'Overview', icon: HeartHandshake, end: true },
  { to: '/ngo/browse', label: 'Browse Donations', icon: Search },
  { to: '/ngo/accepted', label: 'Accepted', icon: PackageCheck },
];

export default function NgoDashboard() {
  const { user } = useAuth();
  const { donations } = useData();
  const [selected, setSelected] = useState(null);
  const { toast } = useToast();
  const [config, setConfig] = useState({
    serviceRadiusKm: user.serviceRadiusKm ?? 25,
    acceptedCategories: user.acceptedCategories || [],
    minQuantity: user.minQuantity ?? 0,
    maxQuantity: user.maxQuantity ?? 0,
    latitude: user.latitude ?? '',
    longitude: user.longitude ?? '',
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await authService.updateProfile(user.id, {
        serviceRadiusKm: Number(config.serviceRadiusKm),
        acceptedCategories: config.acceptedCategories,
        minQuantity: Number(config.minQuantity) || 0,
        maxQuantity: Number(config.maxQuantity) || 0,
        latitude: config.latitude === '' ? null : Number(config.latitude),
        longitude: config.longitude === '' ? null : Number(config.longitude),
      });
      toast('Matching preferences saved.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingConfig(false);
    }
  };
  const toggleCategory = (value) => {
    setConfig((c) => ({
      ...c,
      acceptedCategories: c.acceptedCategories.includes(value)
        ? c.acceptedCategories.filter((x) => x !== value)
        : [...c.acceptedCategories, value],
    }));
  };
  const stats = useMemo(() => ngoStats(donations, user.id), [donations, user.id]);

  const available = useMemo(
    () =>
      donations.filter(
        (d) =>
          d.status === STATUS.PENDING &&
          new Date(d.availableUntil).getTime() > Date.now() &&
          !(d.rejectedBy || []).includes(user.id)
      ),
    [donations, user.id]
  );
  const awaitingReceipt = useMemo(
    () => donations.filter((d) => d.acceptedBy === user.id && d.status === STATUS.DELIVERED),
    [donations, user.id]
  );

  return (
    <DashboardShell
      nav={NGO_NAV}
      title={user.orgName}
      subtitle="Receive surplus food and redistribute it to your community."
      actions={
        <Link to="/ngo/browse" className="hidden sm:block">
          <Button size="sm" icon={Search}>Browse donations</Button>
        </Link>
      }
    >
      {!user.verified && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800" role="alert">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Verification pending</p>
            <p className="text-amber-700">
              You can browse donations, but an admin must verify your organisation before you can accept them.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Inbox} label="Available nearby" value={stats.available} delay={0} />
        <StatCard icon={Clock3} label="In progress" value={stats.accepted} tone="lavender" sub="Accepted → out for delivery" delay={0.05} />
        <StatCard icon={PackageCheck} label="Awaiting your receipt" value={stats.awaitingReceipt} tone="peach" delay={0.1} />
        <StatCard icon={CheckCircle2} label="Completed collections" value={stats.completed} tone="blue" sub={`${stats.mealsReceived.toLocaleString('en-IN')} meals received`} delay={0.15} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="mb-4 font-display text-base font-bold">Matching preferences</h2>
        <p className="mb-4 text-sm text-charcoal/60">
          Configure your service area and the food you can accept. Empty category list means “all categories”.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Service radius (km)</label>
            <input
              type="number"
              min="1"
              max="500"
              className="input"
              value={config.serviceRadiusKm}
              onChange={(e) => setConfig((c) => ({ ...c, serviceRadiusKm: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Latitude</label>
            <input
              type="number"
              step="any"
              className="input"
              value={config.latitude}
              onChange={(e) => setConfig((c) => ({ ...c, latitude: e.target.value }))}
              placeholder="e.g. 12.9352"
            />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input
              type="number"
              step="any"
              className="input"
              value={config.longitude}
              onChange={(e) => setConfig((c) => ({ ...c, longitude: e.target.value }))}
              placeholder="e.g. 77.6245"
            />
          </div>
          <div className="flex items-end">
            <Button size="md" onClick={saveConfig} loading={savingConfig} className="w-full">
              Save preferences
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <p className="label">Accepted food categories</p>
          <div className="flex flex-wrap gap-2">
            {FOOD_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCategory(c.value)}
                className={
                  'chip border transition-all ' +
                  (config.acceptedCategories.includes(c.value)
                    ? 'border-forest-400 bg-forest-50 text-forest-700'
                    : 'border-charcoal/10 bg-white text-charcoal/55 hover:border-charcoal/25')
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Min quantity (0 = none)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={config.minQuantity}
              onChange={(e) => setConfig((c) => ({ ...c, minQuantity: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Max quantity (0 = no limit)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={config.maxQuantity}
              onChange={(e) => setConfig((c) => ({ ...c, maxQuantity: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      {awaitingReceipt.length > 0 && (
        <Card className="mt-6 border-accent/40 bg-peach/30 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-charcoal">
              🍽️ Delivered — confirm receipt to complete
            </h2>
            <Link to="/ngo/accepted" className="flex items-center gap-1 text-xs font-semibold text-forest-600 hover:text-forest-700">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-2">
            {awaitingReceipt.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSelected(d.id)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/70 p-3 text-left transition-colors hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-charcoal">{d.foodName}</p>
                    <p className="text-xs text-charcoal/55">
                      {formatQuantity(d.quantity, d.unit)} · delivered {timeAgo(d.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                  <span className="btn-primary btn-sm pointer-events-none hidden sm:inline-flex">Confirm Receipt</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Fresh donations you can accept</h2>
          <Link to="/ngo/browse" className="flex items-center gap-1 text-xs font-semibold text-forest-600 hover:text-forest-700">
            Browse all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {available.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No available donations right now"
            message="New listings from donors appear here instantly. Check back soon!"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {available.slice(0, 3).map((d, i) => (
              <DonationCard
                key={d.id}
                donation={d}
                index={i}
                distanceKm={matchingService.haversineKmExport(user.latitude, user.longitude, d.pickupLatitude, d.pickupLongitude)}
                onClick={() => setSelected(d.id)}
              />
            ))}
          </div>
        )}
      </div>

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}