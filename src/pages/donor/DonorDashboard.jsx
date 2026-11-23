import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Activity, CheckCircle2, UtensilsCrossed, Plus, ArrowRight, HandHeart } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, Card, Button, StatusBadge, EmptyState, DemoBadge } from '../../components/ui';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { donorStats, donationsByDay } from '../../lib/stats';
import { timeAgo, formatQuantity } from '../../lib/utils';

export const DONOR_NAV = [
  { to: '/donor', label: 'Overview', icon: Activity, end: true },
  { to: '/donor/new', label: 'New Donation', icon: Plus },
  { to: '/donor/donations', label: 'My Donations', icon: Package },
];

export default function DonorDashboard() {
  const { user } = useAuth();
  const { donations } = useData();
  const [selected, setSelected] = useState(null);
  const stats = useMemo(() => donorStats(donations, user.id), [donations, user.id]);
  const chart = useMemo(
    () => donationsByDay(donations.filter((d) => d.donorId === user.id), 14),
    [donations, user.id]
  );

  return (
    <DashboardShell
      nav={DONOR_NAV}
      title={`Hello, ${user.name.split(' ')[0]} 👋`}
      subtitle={user.orgName}
      actions={
        <Link to="/donor/new" className="hidden sm:block">
          <Button size="sm" icon={Plus}>New Donation</Button>
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Total donations" value={stats.total} delay={0} />
        <StatCard icon={Activity} label="Active right now" value={stats.active} tone="peach" delay={0.05} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="lavender" delay={0.1} />
        <StatCard icon={UtensilsCrossed} label="Meals donated" value={stats.mealsDonated.toLocaleString('en-IN')} tone="blue" sub="From completed donations" delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Your donations — last 14 days</h2>
            <DemoBadge />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="donorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#236B4E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#236B4E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#24332B80' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#24332B80' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #24332B10', fontSize: 12 }} />
                <Area type="monotone" dataKey="donations" stroke="#236B4E" strokeWidth={2.5} fill="url(#donorGrad)" name="Donations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Recent activity</h2>
            <Link to="/donor/donations" className="flex items-center gap-1 text-xs font-semibold text-forest-600 hover:text-forest-700">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {stats.recent.length === 0 ? (
            <EmptyState
              icon={HandHeart}
              title="No donations yet"
              message="Register your first surplus food listing — it takes under a minute."
              action={<Link to="/donor/new"><Button icon={Plus}>Create donation</Button></Link>}
            />
          ) : (
            <ul className="space-y-2">
              {stats.recent.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelected(d.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-forest-50/60"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mint">
                      {d.imageUrl && <img src={d.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-charcoal">{d.foodName}</p>
                      <p className="text-xs text-charcoal/50">
                        {formatQuantity(d.quantity, d.unit)} · {timeAgo(d.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}