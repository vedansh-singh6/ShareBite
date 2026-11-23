import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Inbox, X } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Input, Select, EmptyState, Button, Badge } from '../../components/ui';
import DonationCard from '../../components/donations/DonationCard';
import DonationDetailModal from '../../components/donations/DonationDetailModal';
import { NGO_NAV } from './NgoDashboard';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FOOD_CATEGORIES, STATUS } from '../../lib/constants';
import * as matchingService from '../../services/matchingService';

const SORTS = [
  { value: 'urgent', label: 'Most urgent first' },
  { value: 'newest', label: 'Newest first' },
  { value: 'quantity', label: 'Largest quantity' },
  { value: 'nearest', label: 'Nearest first' },
];

export default function BrowseDonations() {
  const { user } = useAuth();
  const { donations } = useData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [diet, setDiet] = useState('all');
  const [sort, setSort] = useState('urgent');
  const [selected, setSelected] = useState(null);

  const available = useMemo(() => {
    let list = donations.filter(
      (d) =>
        d.status === STATUS.PENDING &&
        new Date(d.availableUntil).getTime() > Date.now() &&
        !(d.rejectedBy || []).includes(user.id)
    );
    if (category !== 'all') list = list.filter((d) => d.category === category);
    if (diet !== 'all') list = list.filter((d) => d.diet === diet);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.foodName.toLowerCase().includes(q) ||
          d.pickupAddress.toLowerCase().includes(q)
      );
    }
    const meals = (d) => (d.unit === 'meals' ? d.quantity : d.quantity * 2.5);
    const dist = (d) =>
      matchingService.haversineKmExport(user.latitude, user.longitude, d.pickupLatitude, d.pickupLongitude);
    if (sort === 'urgent') list = [...list].sort((a, b) => a.availableUntil.localeCompare(b.availableUntil));
    if (sort === 'newest') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'quantity') list = [...list].sort((a, b) => meals(b) - meals(a));
    if (sort === 'nearest') list = [...list].sort((a, b) => (dist(a) ?? 9999) - (dist(b) ?? 9999));
    return list.map((d) => ({ ...d, _distance: dist(d) }));
  }, [donations, user.id, query, category, diet, sort, user.latitude, user.longitude]);

  const hasFilters = query || category !== 'all' || diet !== 'all';
  const clearFilters = () => { setQuery(''); setCategory('all'); setDiet('all'); };

  return (
    <DashboardShell
      nav={NGO_NAV}
      title="Browse Donations"
      subtitle="Accept what your organisation can redistribute. Accepted donations are reserved for you."
    >
      <div className="card mb-6 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
            <Input
              className="pl-10"
              placeholder="Search by food name or location…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search available donations"
            />
          </div>
          <div className="grid grid-cols-3 gap-3 lg:w-auto">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="all">All categories</option>
              {FOOD_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Select value={diet} onChange={(e) => setDiet(e.target.value)} aria-label="Filter by food type">
              <option value="all">Veg & Non-veg</option>
              <option value="veg">Veg only</option>
              <option value="non_veg">Non-veg only</option>
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort donations">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3 flex items-center gap-2 border-t border-charcoal/5 pt-3">
            <SlidersHorizontal className="h-3.5 w-3.5 text-charcoal/40" />
            <Badge tone="green">{available.length} result{available.length === 1 ? '' : 's'}</Badge>
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs font-semibold text-charcoal/50 hover:text-red-500">
              <X className="h-3 w-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {available.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={hasFilters ? 'No donations match your filters' : 'No available donations right now'}
          message={
            hasFilters
              ? 'Try widening your search or clearing filters.'
              : 'When donors register surplus food, it appears here instantly.'
          }
          action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : undefined}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {available.map((d, i) => (
            <DonationCard key={d.id} donation={d} index={i} distanceKm={d._distance} onClick={() => setSelected(d.id)} />
          ))}
        </div>
      )}

      <DonationDetailModal donationId={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </DashboardShell>
  );
}