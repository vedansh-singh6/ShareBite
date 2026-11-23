import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageCheck, Search, CheckCircle2 } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Tabs, EmptyState, Button } from '../../components/ui';
import DonationCard from '../../components/donations/DonationCard';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { NGO_NAV } from './NgoDashboard';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { STATUS } from '../../lib/constants';

export default function AcceptedDonations() {
  const { user } = useAuth();
  const { donations } = useData();
  const [tab, setTab] = useState('progress');
  const [selected, setSelected] = useState(null);

  const mine = useMemo(
    () => donations.filter((d) => d.acceptedBy === user.id),
    [donations, user.id]
  );

  const filtered = useMemo(() => {
    if (tab === 'progress')
      return mine.filter((d) => [STATUS.ACCEPTED, STATUS.VOLUNTEER_ASSIGNED, STATUS.PICKED_UP].includes(d.status));
    if (tab === 'receipt') return mine.filter((d) => d.status === STATUS.DELIVERED);
    if (tab === 'completed') return mine.filter((d) => d.status === STATUS.COMPLETED);
    return mine;
  }, [mine, tab]);

  return (
    <DashboardShell
      nav={NGO_NAV}
      title="Accepted Donations"
      subtitle="Track collections and confirm receipt when food arrives."
      actions={
        <Link to="/ngo/browse" className="hidden sm:block">
          <Button size="sm" variant="secondary" icon={Search}>Find more</Button>
        </Link>
      }
    >
      <Tabs
        className="mb-6"
        tabs={[
          { value: 'progress', label: 'In Progress', count: mine.filter((d) => [STATUS.ACCEPTED, STATUS.VOLUNTEER_ASSIGNED, STATUS.PICKED_UP].includes(d.status)).length },
          { value: 'receipt', label: 'Confirm Receipt', count: mine.filter((d) => d.status === STATUS.DELIVERED).length },
          { value: 'completed', label: 'Completed', count: mine.filter((d) => d.status === STATUS.COMPLETED).length },
          { value: 'all', label: 'All', count: mine.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'receipt' && filtered.length > 0 && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-accent/40 bg-peach/40 px-4 py-3 text-sm text-orange-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Open a delivered donation and tap <strong>Confirm Receipt</strong> to mark it completed.</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title={
            tab === 'receipt' ? 'Nothing awaiting receipt'
            : tab === 'completed' ? 'No completed collections yet'
            : 'No accepted donations yet'
          }
          message={
            tab === 'progress' || tab === 'all'
              ? 'Browse available donations and accept the ones you can redistribute.'
              : 'Items will appear here as they move through the pipeline.'
          }
          action={
            (tab === 'progress' || tab === 'all') ? (
              <Link to="/ngo/browse"><Button icon={Search}>Browse donations</Button></Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d, i) => (
            <DonationCard key={d.id} donation={d} index={i} onClick={() => setSelected(d.id)} />
          ))}
        </div>
      )}

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}