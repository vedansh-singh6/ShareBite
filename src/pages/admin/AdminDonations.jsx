import { useMemo, useState } from 'react';
import { Search, Package, Filter } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Card, Input, Select, Badge, EmptyState, StatusBadge, DietBadge } from '../../components/ui';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { ADMIN_NAV } from './AdminDashboard';
import { useData, useLookups } from '../../context/DataContext';
import { STATUS, STATUS_META, CATEGORY_LABELS } from '../../lib/constants';
import { formatQuantity, formatDate, timeLeft } from '../../lib/utils';

export default function AdminDonations() {
  const { donations } = useData();
  const { orgName } = useLookups();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = donations;
    if (status !== 'all') list = list.filter((d) => d.status === status);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.foodName.toLowerCase().includes(q) ||
          orgName(d.donorId).toLowerCase().includes(q) ||
          d.pickupAddress.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [donations, status, query, orgName]);

  return (
    <DashboardShell
      nav={ADMIN_NAV}
      title="Donation Monitoring"
      subtitle="Every donation across the platform, in real time."
    >
      <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
          <Input className="pl-10" placeholder="Search food, donor or location…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search donations" />
        </div>
        <div className="flex items-center gap-2 sm:w-56">
          <Filter className="h-4 w-4 shrink-0 text-charcoal/40" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {Object.entries(STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No donations match" message="Adjust your search or status filter." />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/5 bg-cream/60 text-left text-xs uppercase tracking-wide text-charcoal/45">
                  <th className="px-5 py-3 font-semibold">Food</th>
                  <th className="px-4 py-3 font-semibold">Donor</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Deadline</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {filtered.map((d) => {
                  const left = timeLeft(d.availableUntil);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelected(d.id)}
                      className="cursor-pointer transition-colors hover:bg-forest-50/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-mint">
                            {d.imageUrl && <img src={d.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal">{d.foodName}</p>
                            <p className="text-xs text-charcoal/45">{CATEGORY_LABELS[d.category]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-charcoal/70">{orgName(d.donorId)}</td>
                      <td className="px-4 py-3 text-charcoal/70">{formatQuantity(d.quantity, d.unit)}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3">
                        <span className={left.expired ? 'text-red-500' : left.urgent ? 'text-orange-600' : 'text-charcoal/60'}>
                          {left.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-charcoal/55">{formatDate(d.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((d) => (
              <button key={d.id} onClick={() => setSelected(d.id)} className="card flex w-full items-center gap-3 p-4 text-left">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-mint">
                  {d.imageUrl && <img src={d.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-charcoal">{d.foodName}</p>
                  <p className="truncate text-xs text-charcoal/50">
                    {orgName(d.donorId)} · {formatQuantity(d.quantity, d.unit)}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </button>
            ))}
          </div>
        </>
      )}

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}