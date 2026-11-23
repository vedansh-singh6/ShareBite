import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, Package, Activity, CheckCircle2, ShieldAlert, UtensilsCrossed, ArrowRight, Building2 } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, Card, Button, Badge, DemoBadge } from '../../components/ui';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { useData } from '../../context/DataContext';
import { adminStats, donationsByDay, statusDistribution } from '../../lib/stats';
import { STATUS_META } from '../../lib/constants';
import { timeAgo } from '../../lib/utils';

export const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: Activity, end: true },
  { to: '/admin/users', label: 'Users & NGOs', icon: Users },
  { to: '/admin/donations', label: 'Donations', icon: Package },
];

const STATUS_COLORS = {
  pending: '#F4A261',
  accepted: '#60A5FA',
  volunteer_assigned: '#A78BFA',
  picked_up: '#818CF8',
  delivered: '#2DD4BF',
  completed: '#236B4E',
  rejected: '#F87171',
  cancelled: '#9CA3AF',
};

export default function AdminDashboard() {
  const { users, donations } = useData();
  const [selected, setSelected] = useState(null);
  const stats = useMemo(() => adminStats(users, donations), [users, donations]);
  const daily = useMemo(() => donationsByDay(donations, 14), [donations]);
  const byStatus = useMemo(() => statusDistribution(donations, STATUS_META), [donations]);
  const recent = useMemo(
    () => [...donations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [donations]
  );
  const pendingNgos = users.filter((u) => u.role === 'ngo' && !u.verified);

  return (
    <DashboardShell
      nav={ADMIN_NAV}
      title="Platform Overview"
      subtitle="Monitor users, verification and the full donation pipeline."
      actions={
        <Link to="/admin/users" className="hidden sm:block">
          <Button size="sm" variant="secondary" icon={Users}>Manage users</Button>
        </Link>
      }
    >
      {pendingNgos.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p className="flex-1">
            <strong>{pendingNgos.length} NGO{pendingNgos.length > 1 ? 's' : ''}</strong> awaiting verification.
          </p>
          <Link to="/admin/users">
            <Button size="sm" variant="accent">Review now</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats.users} sub={`${stats.donors} donors · ${stats.ngos} NGOs · ${stats.volunteers} volunteers`} delay={0} />
        <StatCard icon={Package} label="Total donations" value={stats.donations} tone="lavender" delay={0.05} />
        <StatCard icon={Activity} label="Active donations" value={stats.active} tone="peach" delay={0.1} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="blue" sub={`${stats.mealsRedirected.toLocaleString('en-IN')} meals redirected`} delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Donations per day</h2>
            <DemoBadge />
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#24332B80' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#24332B80' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #24332B10', fontSize: 12 }} cursor={{ fill: '#DDF3E4', opacity: 0.5 }} />
                <Bar dataKey="donations" fill="#236B4E" radius={[6, 6, 0, 0]} name="Donations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Pipeline status</h2>
            <DemoBadge />
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {byStatus.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#9CA3AF'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #24332B10', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Latest activity</h2>
          <Link to="/admin/donations" className="flex items-center gap-1 text-xs font-semibold text-forest-600 hover:text-forest-700">
            All donations <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="divide-y divide-charcoal/5">
          {recent.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => setSelected(d.id)}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-forest-50/40"
              >
                <UtensilsCrossed className="h-4 w-4 shrink-0 text-forest-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-charcoal">{d.foodName}</p>
                  <p className="text-xs text-charcoal/50">Updated {timeAgo(d.updatedAt)}</p>
                </div>
                <Badge tone={STATUS_META[d.status]?.tone || 'gray'}>{STATUS_META[d.status]?.label}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}