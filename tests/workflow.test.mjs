// ---------------------------------------------------------------------------
// End-to-end test of the core MVP workflow against the REAL service layer.
// Runs in mock mode with in-memory storage (no browser needed).
//   Donor → NGO accept → Volunteer assign → pickup → delivery → NGO receipt
// plus rejection, cancellation, exclusivity and derived-statistics checks.
// ---------------------------------------------------------------------------
import assert from 'node:assert/strict';
import { resetDb, getDb } from '../src/services/db';
import * as auth from '../src/services/authService';
import * as donations from '../src/services/donationService';
import * as tasks from '../src/services/taskService';
import * as users from '../src/services/userService';
import { STATUS, TASK_STATUS } from '../src/lib/constants';
import { donorStats, ngoStats, volunteerStats, adminStats } from '../src/lib/stats';

let passed = 0;
function ok(cond, label) {
  assert.ok(cond, label);
  passed += 1;
  console.log(`  ✓ ${label}`);
}

const future = (h) => new Date(Date.now() + h * 3600_000).toISOString();

async function main() {
  console.log('\nShareBite — core workflow test\n');
  resetDb();

  // ---- Authenticate all four roles ----------------------------------------
  console.log('Authentication');
  const donor = await auth.login('donor@sharebite.demo', 'demo1234');
  const ngo = await auth.login('ngo@sharebite.demo', 'demo1234');
  const ngo2 = await auth.login('hands@sharebite.demo', 'demo1234');
  const volunteer = await auth.login('volunteer@sharebite.demo', 'demo1234');
  const admin = await auth.login('admin@sharebite.demo', 'demo1234');
  ok(donor.role === 'donor' && ngo.role === 'ngo' && volunteer.role === 'volunteer' && admin.role === 'admin', 'all four roles log in');

  await assert.rejects(() => auth.login('donor@sharebite.demo', 'wrong-password'), 'wrong password is rejected');
  ok(true, 'wrong password rejected');

  // ---- 1. Donor registers surplus food ------------------------------------
  console.log('\n1. Donor creates donation');
  const created = await donations.create(
    {
      foodName: 'Test Biryani',
      category: 'cooked_meals',
      diet: 'veg',
      quantity: 25,
      unit: 'meals',
      preparedAt: new Date().toISOString(),
      availableUntil: future(5),
      storage: 'hot',
      pickupAddress: '12 Test Street, Bengaluru 560001',
      instructions: 'Ring the bell',
      imageUrl: '',
      safetyDeclared: true,
    },
    donor
  );
  ok(created.status === STATUS.PENDING, 'new donation is Pending');
  ok(created.id && created.donorId === donor.id, 'donation has id and correct donor');

  // ---- 2. Donation appears for NGOs ---------------------------------------
  console.log('\n2. Visible to NGOs');
  const available = await donations.getAvailableForNgo(ngo.id);
  ok(available.some((d) => d.id === created.id), 'donation appears in NGO available list');

  // ---- 3. NGO accepts ------------------------------------------------------
  console.log('\n3. NGO accepts');
  await donations.accept(created.id, ngo);
  let d = getDb().donations.find((x) => x.id === created.id);
  ok(d.status === STATUS.ACCEPTED, 'status becomes Accepted');
  ok(d.acceptedBy === ngo.id, 'acceptedBy set to NGO');
  ok(d.taskId, 'collection task auto-created');

  // ---- 4. Donor sees updated status ---------------------------------------
  const donorView = await donations.getForDonor(donor.id);
  ok(donorView.find((x) => x.id === created.id).status === STATUS.ACCEPTED, 'donor sees Accepted status');

  // ---- Exclusivity: no longer available to other NGOs ---------------------
  const available2 = await donations.getAvailableForNgo(ngo2.id);
  ok(!available2.some((x) => x.id === created.id), 'accepted donation hidden from other NGOs');
  await assert.rejects(() => donations.accept(created.id, ngo2), 'second NGO cannot accept');
  ok(true, 'double-accept prevented');

  // ---- 5. Volunteer sees & accepts task -----------------------------------
  console.log('\n4. Volunteer accepts task');
  const openTasks = await tasks.getOpen();
  const task = openTasks.find((t) => t.donationId === created.id);
  ok(task, 'open collection task visible to volunteer');
  await tasks.acceptTask(task.id, volunteer);
  d = getDb().donations.find((x) => x.id === created.id);
  ok(d.status === STATUS.VOLUNTEER_ASSIGNED, 'status becomes Volunteer Assigned');
  ok(d.volunteerId === volunteer.id, 'volunteer linked to donation');

  // ---- 6. Confirm pickup ---------------------------------------------------
  console.log('\n5. Confirm pickup');
  await tasks.confirmPickup(task.id, volunteer);
  d = getDb().donations.find((x) => x.id === created.id);
  ok(d.status === STATUS.PICKED_UP, 'status becomes Picked Up');

  // ---- 7. Confirm delivery -------------------------------------------------
  console.log('\n6. Confirm delivery');
  await tasks.confirmDelivery(task.id, volunteer);
  d = getDb().donations.find((x) => x.id === created.id);
  ok(d.status === STATUS.DELIVERED, 'status becomes Delivered');

  // ---- 8 & 9. NGO confirms receipt → Completed ----------------------------
  console.log('\n7. NGO confirms receipt');
  await donations.confirmReceipt(created.id, ngo);
  d = getDb().donations.find((x) => x.id === created.id);
  ok(d.status === STATUS.COMPLETED, 'status becomes Completed');
  const t = getDb().tasks.find((x) => x.id === task.id);
  ok(t.status === TASK_STATUS.COMPLETED, 'task marked Completed');
  ok(d.timeline.length === 6, 'full 6-step timeline recorded');

  // ---- 10. All dashboards reflect the update ------------------------------
  console.log('\n8. Cross-dashboard consistency');
  const ds = donorStats(getDb().donations, donor.id);
  const ns = ngoStats(getDb().donations, ngo.id);
  const vs = volunteerStats(getDb().tasks, volunteer.id);
  ok(ds.completed >= 1, 'donor completed count reflects record');
  ok(ns.completed >= 1, 'NGO completed count reflects record');
  ok(vs.completed >= 1, 'volunteer completed count reflects record');
  ok(ds.mealsDonated >= 25, 'donor meals derived from quantity');

  // ---- Rejection path ------------------------------------------------------
  console.log('\n9. Rejection path');
  const rejectable = await donations.create(
    { foodName: 'Reject Me', category: 'bakery', diet: 'veg', quantity: 5, unit: 'kg',
      preparedAt: new Date().toISOString(), availableUntil: future(6), storage: 'room_temp',
      pickupAddress: '1 Test Ave', safetyDeclared: true },
    donor
  );
  await donations.reject(rejectable.id, ngo);
  const availAfterReject = await donations.getAvailableForNgo(ngo.id);
  ok(!availAfterReject.some((x) => x.id === rejectable.id), 'declined donation hidden from that NGO');
  const availOther = await donations.getAvailableForNgo(ngo2.id);
  ok(availOther.some((x) => x.id === rejectable.id), 'declined donation still visible to other NGOs');

  // ---- Cancellation path ---------------------------------------------------
  console.log('\n10. Cancellation path');
  const cancellable = await donations.create(
    { foodName: 'Cancel Me', category: 'packaged', diet: 'veg', quantity: 10, unit: 'packs',
      preparedAt: new Date().toISOString(), availableUntil: future(6), storage: 'room_temp',
      pickupAddress: '2 Test Ave', safetyDeclared: true },
    donor
  );
  await donations.cancel(cancellable.id, donor);
  ok(getDb().donations.find((x) => x.id === cancellable.id).status === STATUS.CANCELLED, 'donation cancelled');

  // ---- Validation guards ---------------------------------------------------
  console.log('\n11. Validation guards');
  await assert.rejects(
    () => donations.create({ foodName: 'No Safety', category: 'dairy', diet: 'veg', quantity: 1, unit: 'kg',
      preparedAt: new Date().toISOString(), availableUntil: future(2), storage: 'refrigerated',
      pickupAddress: '3 Test Ave', safetyDeclared: false }, donor),
    'safety declaration required'
  );
  ok(true, 'safety declaration enforced');

  // ---- Admin: NGO verification gate ---------------------------------------
  console.log('\n12. Admin NGO verification');
  const unverified = getDb().users.find((u) => u.id === 'usr_ngo3');
  ok(unverified.verified === false, 'seed NGO starts unverified');
  const pendingDonation = await donations.create(
    { foodName: 'Verify Gate', category: 'grains', diet: 'veg', quantity: 8, unit: 'kg',
      preparedAt: new Date().toISOString(), availableUntil: future(6), storage: 'room_temp',
      pickupAddress: '4 Test Ave', safetyDeclared: true },
    donor
  );
  await assert.rejects(() => donations.accept(pendingDonation.id, unverified), 'unverified NGO cannot accept');
  ok(true, 'unverified NGO blocked from accepting');
  await users.verifyNgo(unverified.id, true);
  await donations.accept(pendingDonation.id, unverified);
  ok(getDb().donations.find((x) => x.id === pendingDonation.id).acceptedBy === unverified.id, 'verified NGO can accept');

  // ---- Admin stats ---------------------------------------------------------
  const as = adminStats(getDb().users, getDb().donations);
  ok(as.users === getDb().users.length, 'admin user count derived from records');
  ok(as.donations === getDb().donations.length, 'admin donation count derived from records');

  console.log(`\n✅ All ${passed} workflow assertions passed.\n`);
}

main().catch((err) => {
  console.error('\n❌ Workflow test failed:', err.message);
  process.exit(1);
});