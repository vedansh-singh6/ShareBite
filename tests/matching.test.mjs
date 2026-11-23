// Tests for Phase 2 Module 1: location-based NGO matching.
import assert from 'node:assert/strict';
import { resetDb, getDb } from '../src/services/db';
import * as matching from '../src/services/matchingService';
import { haversineKmExport } from '../src/services/matchingService';

let passed = 0;
function ok(cond, label) { assert.ok(cond, label); passed += 1; console.log(`  ✓ ${label}`); }

async function main() {
  console.log('\nShareBite — NGO matching test\n');
  resetDb();

  // ---- Haversine sanity ---------------------------------------------------
  console.log('Haversine');
  const d = haversineKmExport(12.9784, 77.6408, 12.9352, 77.6245);
  ok(typeof d === 'number' && d > 0 && d < 20, `distance between donor1 and ngo1 is ${d} km (sensible)`);
  ok(haversineKmExport(null, 1, 2, 3) === null, 'null coords return null');

  // ---- nearby_ngos basic --------------------------------------------------
  console.log('\nNearby NGOs');
  const near = await matching.getNearby(12.9784, 77.6408, { radius: 25 });
  ok(Array.isArray(near) && near.length >= 1, `found ${near.length} NGO(s) near Indiranagar`);
  ok(near.every((r) => r.distanceKm <= 25), 'all results within radius');
  // sorted by distance
  for (let i = 1; i < near.length; i++) ok(near[i - 1].distanceKm <= near[i].distanceKm, 'results sorted by distance');

  // ---- category filter ----------------------------------------------------
  console.log('\nCategory filter');
  const cat = await matching.getNearby(12.9784, 77.6408, { radius: 25, category: 'cooked_meals' });
  // ngo2 accepts cooked_meals but is ~? away; ngo1 accepts all (empty list). Both should remain.
  ok(cat.length >= 1, `category filter keeps ${cat.length} NGO(s)`);
  ok(cat.every((r) => r.reasons.some((x) => x.includes('Accepts') || r.ngo.acceptedCategories.length === 0)),
     'accepted-category reason present or wildcard');

  // ---- quantity filter ----------------------------------------------------
  console.log('\nQuantity filter');
  const qty = await matching.getNearby(12.9784, 77.6408, { radius: 25, quantity: 1000 });
  ok(qty.length === 0 || qty.every((r) => r.ngo.maxQuantity === 0 || 1000 <= r.ngo.maxQuantity),
     'quantity filter excludes NGOs whose max is exceeded');

  // ---- no nearby NGO ------------------------------------------------------
  console.log('\nNo nearby NGO');
  const none = await matching.getNearby(0, 0, { radius: 5 });
  ok(Array.isArray(none) && none.length === 0, 'remote point returns empty list');

  // ---- invalid coords ----------------------------------------------------
  console.log('\nValidation');
  await assert.rejects(() => matching.getNearby(999, 0, { radius: 25 }), 'invalid latitude rejected');
  ok(true, 'invalid latitude rejected');
  await assert.rejects(() => matching.getNearby(10, 10, { radius: 0 }), 'zero radius rejected');
  ok(true, 'zero radius rejected');
  await assert.rejects(() => matching.getNearby(10, 10, { radius: 1000 }), 'oversized radius rejected');
  ok(true, 'oversized radius rejected');

  // ---- matches for donation ----------------------------------------------
  console.log('\nDonation matches');
  const db = getDb();
  const don = db.donations.find((d) => d.pickupLatitude);
  ok(!!don, 'seed donation has pickup coordinates');
  const matches = await matching.getMatchesForDonation(don.id);
  ok(Array.isArray(matches), 'matches returns an array');
  ok(matches.every((m) => typeof m.distanceKm === 'number' && Array.isArray(m.reasons)),
     'each match has distanceKm + reasons');

  // donation without coords
  const noCoordDonation = { ...don, id: 'don_nocoord', pickupLatitude: null, pickupLongitude: null };
  db.donations.push(noCoordDonation);
  await assert.rejects(() => matching.getMatchesForDonation('don_nocoord'), 'donation without coords rejected');
  ok(true, 'donation without coords rejected');

  // unknown donation
  await assert.rejects(() => matching.getMatchesForDonation('don_does_not_exist'), 'unknown donation rejected');
  ok(true, 'unknown donation rejected');

  console.log(`\n✅ All ${passed} matching assertions passed.\n`);
}

main().catch((err) => { console.error('\n❌ Matching test failed:', err.message); process.exit(1); });