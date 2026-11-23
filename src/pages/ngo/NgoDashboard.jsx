import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, HeartHandshake, PackageCheck, Clock3, CheckCircle2, ArrowRight, ShieldAlert, Inbox } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, Card, Button, EmptyState, StatusBadge } from '../../components/ui';
import DonationCard from '../../components/donations/DonationCard';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ngoStats } from '../../lib/stats';
import { STATUS } from '../../lib/constants';
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
              <DonationCard key={d.id} donation={d} index={i} onClick={() => setSelected(d.id)} />
            ))}
          </div>
        )}
      </div>

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}