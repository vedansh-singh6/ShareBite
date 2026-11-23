import { useMemo, useState } from 'react';
import { Bike, Navigation, CheckCircle2, Inbox } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, Tabs, EmptyState } from '../../components/ui';
import TaskCard from '../../components/donations/TaskCard';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { volunteerStats } from '../../lib/stats';
import { TASK_STATUS } from '../../lib/constants';

export const VOLUNTEER_NAV = [
  { to: '/volunteer', label: 'Tasks', icon: Bike, end: true },
  { to: '/volunteer/history', label: 'History', icon: CheckCircle2 },
];

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { tasks } = useData();
  const [tab, setTab] = useState('available');
  const [selected, setSelected] = useState(null);
  const stats = useMemo(() => volunteerStats(tasks, user.id), [tasks, user.id]);

  const openTasks = useMemo(() => tasks.filter((t) => t.status === TASK_STATUS.OPEN), [tasks]);
  const availableTasks = useMemo(
    () => tasks.filter((t) => t.status === TASK_STATUS.OPEN && !(t.declinedBy || []).includes(user.id)),
    [tasks, user.id]
  );
  const myActive = useMemo(
    () => tasks.filter((t) => t.volunteerId === user.id && [TASK_STATUS.ASSIGNED, TASK_STATUS.PICKED_UP, TASK_STATUS.DELIVERED].includes(t.status)),
    [tasks, user.id]
  );

  const list = tab === 'available' ? availableTasks : myActive;

  return (
    <DashboardShell
      nav={VOLUNTEER_NAV}
      title={`Let's ride, ${user.name.split(' ')[0]} 🚴`}
      subtitle={user.area ? `Serving ${user.area}` : 'Collect food, deliver hope.'}
    >
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Inbox} label="Available" value={stats.open} delay={0} />
        <StatCard icon={Navigation} label="My active" value={stats.active + stats.awaitingReceipt} tone="peach" delay={0.05} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="lavender" delay={0.1} />
      </div>

      <Tabs
        className="mt-6 mb-5 w-full sm:w-auto"
        tabs={[
          { value: 'available', label: 'Available Tasks', count: availableTasks.length },
          { value: 'active', label: 'My Active Tasks', count: myActive.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={tab === 'available' ? Inbox : Navigation}
          title={tab === 'available' ? 'No open tasks right now' : 'You have no active tasks'}
          message={
            tab === 'available'
              ? 'When an NGO accepts a donation, a collection task appears here instantly.'
              : 'Accept an available task to start collecting and delivering food.'
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t, i) => (
            <TaskCard key={t.id} task={t} index={i} onOpenDonation={setSelected} />
          ))}
        </div>
      )}

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}