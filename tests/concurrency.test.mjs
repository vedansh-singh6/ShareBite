import assert from 'node:assert/strict';
import { resetDb } from '../src/services/db';
import * as auth from '../src/services/authService';
import * as donations from '../src/services/donationService';
import * as tasks from '../src/services/taskService';

async function main() {
  console.log('\nShareBite — concurrent task assignment test\n');
  resetDb();
  const ngo = await auth.login('ngo@sharebite.demo', 'demo1234');
  const v1 = await auth.login('volunteer@sharebite.demo', 'demo1234');
  const v2 = await auth.login('priya@sharebite.demo', 'demo1234');
  const donor = await auth.login('donor@sharebite.demo', 'demo1234');

  const d = await donations.create({
    foodName: 'Concurrency Test', category: 'cooked_meals', diet: 'veg', quantity: 10, unit: 'meals',
    preparedAt: new Date().toISOString(), availableUntil: new Date(Date.now() + 5*3600_000).toISOString(),
    storage: 'hot', pickupAddress: '1 Test St', safetyDeclared: true,
  }, donor);
  await donations.accept(d.id, ngo);
  const updated = await donations.getById(d.id);
  const task = await tasks.getByDonation(updated.id);

  // First volunteer claims
  await tasks.acceptTask(task.id, v1);
  console.log('  ✓ first volunteer claimed task');

  // Second volunteer must fail
  await assert.rejects(() => tasks.acceptTask(task.id, v2), /already been taken/);
  console.log('  ✓ second volunteer rejected (task already taken)');

  // Decline path
  const d2 = await donations.create({
    foodName: 'Decline Test', category: 'bakery', diet: 'veg', quantity: 5, unit: 'kg',
    preparedAt: new Date().toISOString(), availableUntil: new Date(Date.now() + 5*3600_000).toISOString(),
    storage: 'room_temp', pickupAddress: '2 Test St', safetyDeclared: true,
  }, donor);
  await donations.accept(d2.id, ngo);
  const t2 = await tasks.getByDonation((await donations.getById(d2.id)).id);
  await tasks.declineTask(t2.id, v1);
  console.log('  ✓ volunteer declined task');
  const allTasks = await tasks.getAll();
  const after = allTasks.find((t) => t.id === t2.id);
  assert.ok((after.declinedBy || []).includes(v1.id), 'declinedBy recorded');
  console.log('  ✓ declinedBy recorded');

  // Status transition validation
  await tasks.acceptTask(t2.id, v2);
  await assert.rejects(() => tasks.updateTaskStatus(t2.id, v2, 'delivered'), /Cannot move/);
  console.log('  ✓ invalid transition rejected');
  await tasks.updateTaskStatus(t2.id, v2, 'picked_up');
  console.log('  ✓ picked_up transition ok');

  console.log('\n✅ Concurrency/assignment tests passed.\n');
}

main().catch((e) => { console.error('\n❌ Failed:', e.message); process.exit(1); });