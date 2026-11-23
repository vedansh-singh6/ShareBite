// ---------------------------------------------------------------------------
// Location-based NGO matching service (Phase 2 Module 1).
// Mock mode computes Haversine distance + filtering + ranking locally against
// the shared mock DB. Flask mode calls the real /api endpoints.
// ---------------------------------------------------------------------------
import { IS_MOCK, http } from './apiClient';
import { getDb } from './db';
import { delay } from '../lib/utils';

function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined || v === '')) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const p1 = toRad(lat1), p2 = toRad(lat2);
  const dphi = toRad(lat2 - lat1);
  const dl = toRad(lon2 - lon1);
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 100) / 100;
}

function validCoord(lat, lon) {
  return lat !== null && lat !== undefined && lon !== null && lon !== undefined &&
    Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/** Nearby NGOs for a given point (+ optional category/quantity filters). */
export async function getNearby(lat, lon, { radius = 25, category = null, quantity = 0 } = {}) {
  if (IS_MOCK) {
    await delay(150);
    if (!validCoord(lat, lon)) throw new Error('Invalid location coordinates.');
    if (radius === null || radius === undefined || radius <= 0 || radius > 500) throw new Error('Service radius must be between 1 and 500 km.');
    const db = getDb();
    const results = [];
    for (const ngo of db.users.filter((u) => u.role === 'ngo' && u.active && u.verified)) {
      if (!validCoord(ngo.latitude, ngo.longitude)) continue;
      if (!validCoord(lat, lon)) throw new Error('Invalid location coordinates.');
      const dist = haversineKm(lat, lon, ngo.latitude, ngo.longitude);
      if (dist === null) continue;
      const r = ngo.serviceRadiusKm || radius;
      if (dist > r || dist > radius) continue;
      const reasons = [`Within ${dist} km service area`];
      const accepted = ngo.acceptedCategories || [];
      if (category && accepted.length && !accepted.includes(category)) continue;
      if (category && accepted.includes(category)) reasons.push(`Accepts ${category.replace(/_/g, ' ')}`);
      if (quantity && ngo.minQuantity && quantity < ngo.minQuantity) continue;
      if (quantity && ngo.maxQuantity && ngo.maxQuantity > 0 && quantity > ngo.maxQuantity) continue;
      if (quantity) reasons.push('Quantity fits requirements');
      results.push({ ngo, distanceKm: dist, reasons });
    }
    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return results;
  }
  const params = new URLSearchParams({ lat, lon, radius });
  if (category) params.set('category', category);
  if (quantity) params.set('quantity', quantity);
  const { data } = await http.get(`/ngos/nearby?${params.toString()}`);
  return data;
}

/** Recommended NGOs for a specific donation. */
export async function getMatchesForDonation(donationId) {
  if (IS_MOCK) {
    await delay(180);
    const db = getDb();
    const donation = db.donations.find((d) => d.id === donationId);
    if (!donation) throw new Error('Donation not found.');
    if (!validCoord(donation.pickupLatitude, donation.pickupLongitude)) {
      throw new Error('Donation has no valid pickup coordinates.');
    }
    return getNearby(donation.pickupLatitude, donation.pickupLongitude, {
      radius: 100,
      category: donation.category,
      quantity: donation.quantity,
    });
  }
  const { data } = await http.get(`/donations/${donationId}/matches`);
  return data;
}

export function haversineKmExport(lat1, lon1, lat2, lon2) {
  return haversineKm(lat1, lon1, lat2, lon2);
}