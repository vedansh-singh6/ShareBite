import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Search } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Button, Tabs, Input, EmptyState } from '../../components/ui';
import DonationCard from '../../components/donations/DonationCard';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { DONOR_NAV } from './DonorDashboard';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { isActive } from '../../lib/stats';
import { STATUS } from '../../lib/constants';

export default function MyDonations() {
  const { user } = useAuth();
  const { donations } = useData();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const mine = useMemo(
    () => donations.filter((d) => d.donorId === user.id),
    [donations, user.id]
  );

  const filtered = useMemo(() => {
    let list = mine;
    if (tab === 'active') list = list.filter(isActive);
    if (tab === 'completed') list = list.filter((d) => d.status === STATUS.COMPLETED);
    if (tab === 'closed') list = list.filter((d) => [STATUS.CANCELLED, STATUS.REJECTED].includes(d.status));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((d) => d.foodName.toLowerCase().includes(q));
    }
    return list;
  }, [mine, tab, query]);

  return (
    <DashboardShell
      nav={DONOR_NAV}
      title="My Donations"
      subtitle="Track every listing through the full redistribution pipeline."
      actions={
        <Link to="/donor/new" className="hidden sm:block">
          <Button size="sm" icon={Plus}>New Donation</Button>
        </Link>
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={[
            { value: 'all', label: 'All', count: mine.length },
            { value: 'active', label: 'Active', count: mine.filter(isActive).length },
            { value: 'completed', label: 'Completed', count: mine.filter((d) => d.status === STATUS.COMPLETED).length },
            { value: 'closed', label: 'Cancelled', count: mine.filter((d) => d.status === STATUS.CANCELLED).length },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="relative sm:w-64">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
          <Input
            className="pl-10"
            placeholder="Search donations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search donations"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={mine.length === 0 ? 'No donations yet' : 'Nothing matches your filters'}
          message={
            mine.length === 0
              ? 'Your surplus food listings will appear here with live status tracking.'
              : 'Try a different tab or search term.'
          }
          action={
            mine.length === 0 ? (
              <Link to="/donor/new"><Button icon={Plus}>Register your first donation</Button></Link>
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