import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Bike, ArrowRight } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { EmptyState, Button, Card, Badge } from '../../components/ui';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { VOLUNTEER_NAV } from './VolunteerDashboard';
import { useAuth } from '../../context/AuthContext';
import { useData, useLookups } from '../../context/DataContext';
import { TASK_STATUS } from '../../lib/constants';
import { formatQuantity, formatDate, timeAgo } from '../../lib/utils';
import { toMeals } from '../../lib/stats';

export default function VolunteerHistory() {
  const { user } = useAuth();
  const { tasks, donations } = useData();
  const { orgName } = useLookups();
  const [selected, setSelected] = useState(null);

  const completed = useMemo(
    () =>
      tasks
        .filter((t) => t.volunteerId === user.id && t.status === TASK_STATUS.COMPLETED)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [tasks, user.id]
  );

  const totalMeals = completed.reduce((sum, t) => {
    const d = donations.find((x) => x.id === t.donationId);
    return sum + (d ? toMeals(d) : 0);
  }, 0);

  return (
    <DashboardShell
      nav={VOLUNTEER_NAV}
      title="Delivery History"
      subtitle="Every completed collection you've made."
    >
      <Card className="mb-6 flex flex-wrap items-center gap-6 bg-gradient-to-r from-forest-600 to-forest-700 p-6 text-white">
        <div>
          <p className="font-display text-3xl font-extrabold">{completed.length}</p>
          <p className="text-sm text-white/70">Collections completed</p>
        </div>
        <div className="h-10 w-px bg-white/20" aria-hidden="true" />
        <div>
          <p className="font-display text-3xl font-extrabold">{totalMeals.toLocaleString('en-IN')}</p>
          <p className="text-sm text-white/70">Meals delivered by you</p>
        </div>
        <CheckCircle2 className="ml-auto h-10 w-10 text-sage" />
      </Card>

      {completed.length === 0 ? (
        <EmptyState
          icon={Bike}
          title="No completed deliveries yet"
          message="Accept a task, pick up the food and deliver it — your history will build up here."
          action={<Link to="/volunteer"><Button icon={ArrowRight}>Find a task</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {completed.map((t) => {
            const d = donations.find((x) => x.id === t.donationId);
            if (!d) return null;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(d.id)}
                className="card flex w-full items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-mint">
                  {d.imageUrl && <img src={d.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-charcoal">{d.foodName}</p>
                  <p className="truncate text-xs text-charcoal/55">
                    {orgName(d.donorId)} → {orgName(d.acceptedBy)} · {formatQuantity(d.quantity, d.unit)}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-charcoal/60">{formatDate(t.updatedAt)}</p>
                  <p className="text-[11px] text-charcoal/40">{timeAgo(t.updatedAt)}</p>
                </div>
                <Badge tone="green">Completed</Badge>
              </button>
            );
          })}
        </div>
      )}

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}