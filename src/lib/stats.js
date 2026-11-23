// ---------------------------------------------------------------------------
// Derived statistics & selectors. Every dashboard number comes from actual
// donation/task records — nothing is hardcoded.
// ---------------------------------------------------------------------------
import { STATUS, TASK_STATUS } from './constants';

export const ACTIVE_STATUSES = [
  STATUS.PENDING,
  STATUS.ACCEPTED,
  STATUS.VOLUNTEER_ASSIGNED,
  STATUS.PICKED_UP,
  STATUS.DELIVERED,
];

export function isActive(donation) {
  return ACTIVE_STATUSES.includes(donation.status);
}

/** Convert any donation quantity into an approximate "meals" figure for impact stats. */
export function toMeals(donation) {
  if (donation.unit === 'meals') return donation.quantity;
  if (donation.unit === 'kg') return Math.round(donation.quantity * 2.5); // ~400g per meal
  if (donation.unit === 'litres') return Math.round(donation.quantity * 2);
  if (donation.unit === 'packs') return donation.quantity;
  return donation.quantity;
}

export function donorStats(donations, donorId) {
  const mine = donations.filter((d) => d.donorId === donorId);
  const completed = mine.filter((d) => d.status === STATUS.COMPLETED);
  return {
    total: mine.length,
    active: mine.filter(isActive).length,
    completed: completed.length,
    mealsDonated: completed.reduce((sum, d) => sum + toMeals(d), 0),
    recent: mine.slice(0, 6),
  };
}

export function ngoStats(donations, ngoId) {
  const available = donations.filter(
    (d) =>
      d.status === STATUS.PENDING &&
      new Date(d.availableUntil).getTime() > Date.now() &&
      !(d.rejectedBy || []).includes(ngoId)
  );
  const mine = donations.filter((d) => d.acceptedBy === ngoId);
  return {
    available: available.length,
    accepted: mine.filter((d) =>
      [STATUS.ACCEPTED, STATUS.VOLUNTEER_ASSIGNED, STATUS.PICKED_UP].includes(d.status)
    ).length,
    awaitingReceipt: mine.filter((d) => d.status === STATUS.DELIVERED).length,
    completed: mine.filter((d) => d.status === STATUS.COMPLETED).length,
    mealsReceived: mine
      .filter((d) => d.status === STATUS.COMPLETED)
      .reduce((sum, d) => sum + toMeals(d), 0),
  };
}

export function volunteerStats(tasks, volunteerId) {
  const mine = tasks.filter((t) => t.volunteerId === volunteerId);
  return {
    open: tasks.filter((t) => t.status === TASK_STATUS.OPEN).length,
    active: mine.filter((t) => [TASK_STATUS.ASSIGNED, TASK_STATUS.PICKED_UP].includes(t.status)).length,
    awaitingReceipt: mine.filter((t) => t.status === TASK_STATUS.DELIVERED).length,
    completed: mine.filter((t) => t.status === TASK_STATUS.COMPLETED).length,
  };
}

export function adminStats(users, donations) {
  const completed = donations.filter((d) => d.status === STATUS.COMPLETED);
  return {
    users: users.length,
    donors: users.filter((u) => u.role === 'donor').length,
    ngos: users.filter((u) => u.role === 'ngo').length,
    volunteers: users.filter((u) => u.role === 'volunteer').length,
    unverifiedNgos: users.filter((u) => u.role === 'ngo' && !u.verified).length,
    donations: donations.length,
    active: donations.filter(isActive).length,
    completed: completed.length,
    mealsRedirected: completed.reduce((sum, d) => sum + toMeals(d), 0),
  };
}

/** Daily donation counts for the last N days (for Recharts). */
export function donationsByDay(donations, days = 14) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day.getTime() + 86400_000);
    const inDay = donations.filter((d) => {
      const t = new Date(d.createdAt).getTime();
      return t >= day.getTime() && t < next.getTime();
    });
    out.push({
      day: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      donations: inDay.length,
      meals: inDay.reduce((s, d) => s + toMeals(d), 0),
    });
  }
  return out;
}

/** Category distribution for pie charts. */
export function donationsByCategory(donations, categoryLabels) {
  const counts = {};
  donations.forEach((d) => {
    counts[d.category] = (counts[d.category] || 0) + 1;
  });
  return Object.entries(counts).map(([value, count]) => ({
    name: categoryLabels[value] || value,
    value: count,
  }));
}

export function statusDistribution(donations, statusMeta) {
  const counts = {};
  donations.forEach((d) => {
    counts[d.status] = (counts[d.status] || 0) + 1;
  });
  return Object.entries(counts).map(([status, count]) => ({
    name: statusMeta[status]?.label || status,
    value: count,
    status,
  }));
}