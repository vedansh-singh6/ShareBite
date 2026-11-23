// ---------------------------------------------------------------------------
// Donation service — all donation business logic lives here, never in the UI.
// Implements the core MVP workflow:
//   Pending → Accepted → Volunteer Assigned → Picked Up → Delivered → Completed
// plus Rejected (per-NGO decline) and Cancelled (donor withdrawal).
// ---------------------------------------------------------------------------
import { IS_MOCK, http } from './apiClient';
import { getDb, mutate } from './db';
import { STATUS, TASK_STATUS } from '../lib/constants';
import { uid, nowISO, delay } from '../lib/utils';
import { pushNotification } from './notificationService';

function findDonation(db, id) {
  const donation = db.donations.find((d) => d.id === id);
  if (!donation) throw new Error('Donation not found.');
  return donation;
}

function transition(db, donation, status, by, note) {
  donation.status = status;
  donation.updatedAt = nowISO();
  donation.timeline.push({ status, at: nowISO(), by, note });
}

function ngoName(db, id) {
  return db.users.find((u) => u.id === id)?.orgName || 'an NGO';
}

function volunteerIds(db) {
  return db.users.filter((u) => u.role === 'volunteer' && u.active).map((u) => u.id);
}

function ngoIds(db) {
  return db.users.filter((u) => u.role === 'ngo' && u.active).map((u) => u.id);
}

// ---- Queries ---------------------------------------------------------------

export async function getAll() {
  if (IS_MOCK) {
    await delay(180);
    return [...getDb().donations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data } = await http.get('/donations');
  return data;
}

export async function getById(id) {
  if (IS_MOCK) {
    await delay(120);
    const d = getDb().donations.find((x) => x.id === id);
    if (!d) throw new Error('Donation not found.');
    return d;
  }
  const { data } = await http.get(`/donations/${id}`);
  return data;
}

export async function getForDonor(donorId) {
  const all = await getAll();
  return all.filter((d) => d.donorId === donorId);
}

/** Donations an NGO can still act on: pending, not expired, not declined by them. */
export async function getAvailableForNgo(ngoId) {
  const all = await getAll();
  const now = Date.now();
  return all.filter(
    (d) =>
      d.status === STATUS.PENDING &&
      new Date(d.availableUntil).getTime() > now &&
      !(d.rejectedBy || []).includes(ngoId)
  );
}

/** Everything an NGO has accepted (any stage after acceptance). */
export async function getForNgo(ngoId) {
  const all = await getAll();
  return all.filter((d) => d.acceptedBy === ngoId);
}

// ---- Commands --------------------------------------------------------------

export async function create(payload, donor) {
  if (IS_MOCK) {
    await delay(350);
    // Compute target NGOs before mutating (matching may be async).
    let preTargetNgos = null;
    const preLat = payload.pickupLatitude === '' || payload.pickupLatitude === null || payload.pickupLatitude === undefined ? null : Number(payload.pickupLatitude);
    const preLon = payload.pickupLongitude === '' || payload.pickupLongitude === null || payload.pickupLongitude === undefined ? null : Number(payload.pickupLongitude);
    if (Number.isFinite(preLat) && Number.isFinite(preLon)) {
      try {
        const { getNearby } = await import('./matchingService');
        const matches = await getNearby(preLat, preLon, { radius: 100, category: payload.category, quantity: Number(payload.quantity) });
        if (matches.length) preTargetNgos = matches.map((m) => m.ngo.id);
      } catch {
        /* fall back to all NGOs */
      }
    }
    return mutate((db) => {
      if (!payload.safetyDeclared) {
        throw new Error('You must confirm the food safety declaration.');
      }
      const donation = {
        id: uid('don'),
        donorId: donor.id,
        foodName: payload.foodName.trim(),
        category: payload.category,
        diet: payload.diet,
        quantity: Number(payload.quantity),
        unit: payload.unit,
        preparedAt: new Date(payload.preparedAt).toISOString(),
        availableUntil: new Date(payload.availableUntil).toISOString(),
        storage: payload.storage,
        pickupAddress: payload.pickupAddress.trim(),
        pickupLatitude: preLat,
        pickupLongitude: preLon,
        instructions: (payload.instructions || '').trim(),
        imageUrl: payload.imageUrl || '',
        safetyDeclared: true,
        status: STATUS.PENDING,
        acceptedBy: null,
        rejectedBy: [],
        volunteerId: null,
        taskId: null,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        timeline: [
          { status: STATUS.PENDING, at: nowISO(), by: donor.id, note: 'Donation registered' },
        ],
        demo: false,
      };
      if (new Date(donation.availableUntil) <= new Date(donation.preparedAt)) {
        throw new Error('"Available until" must be after the preparation time.');
      }
      db.donations.unshift(donation);
      const targetNgos = preTargetNgos || ngoIds(db);
      pushNotification(db, targetNgos, {
        title: 'New donation available',
        body: `${donor.orgName || donor.name} listed ${donation.quantity} ${donation.unit} of ${donation.foodName}.`,
        donationId: donation.id,
      });
      return donation;
    });
  }
  const { data } = await http.post('/donations', payload);
  return data;
}

export async function accept(donationId, ngo) {
  if (IS_MOCK) {
    await delay(300);
    return mutate((db) => {
      const donation = findDonation(db, donationId);
      if (donation.status !== STATUS.PENDING) {
        throw new Error('This donation is no longer available.');
      }
      if (new Date(donation.availableUntil).getTime() <= Date.now()) {
        throw new Error('This donation has expired.');
      }
      if ((donation.rejectedBy || []).includes(ngo.id)) {
        throw new Error('You have already declined this donation.');
      }
      if (!ngo.verified) {
        throw new Error('Your NGO must be verified by an admin before accepting donations.');
      }
      transition(db, donation, STATUS.ACCEPTED, ngo.id, `Accepted by ${ngo.orgName}`);
      donation.acceptedBy = ngo.id;

      // Auto-create the collection task for volunteers.
      const task = {
        id: uid('task'),
        donationId: donation.id,
        status: TASK_STATUS.OPEN,
        volunteerId: null,
        pickupAddress: donation.pickupAddress,
        deliveryAddress: ngo.address,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        timeline: [
          { status: TASK_STATUS.OPEN, at: nowISO(), by: ngo.id, note: 'Task created when NGO accepted' },
        ],
        demo: false,
      };
      db.tasks.unshift(task);
      donation.taskId = task.id;

      pushNotification(db, donation.donorId, {
        title: 'Donation accepted 🎉',
        body: `${ngo.orgName} accepted "${donation.foodName}". A volunteer will be assigned shortly.`,
        donationId: donation.id,
      });
      // Notify eligible (nearby) volunteers when coordinates are available.
      let targetVols = volunteerIds(db);
      if (Number.isFinite(donation.pickupLatitude) && Number.isFinite(donation.pickupLongitude)) {
        const nearby = volunteerIds(db).filter((vid) => {
          const v = db.users.find((u) => u.id === vid);
          if (!v || !Number.isFinite(v.latitude) || !Number.isFinite(v.longitude)) return true;
          // reuse haversine
          const R = 6371;
          const toRad = (d) => (d * Math.PI) / 180;
          const p1 = toRad(donation.pickupLatitude), p2 = toRad(v.latitude);
          const dphi = toRad(v.latitude - donation.pickupLatitude);
          const dl = toRad(v.longitude - donation.pickupLongitude);
          const a = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
          const dist = 2 * R * Math.asin(Math.sqrt(a));
          return dist <= 30;
        });
        if (nearby.length) targetVols = nearby;
      }
      pushNotification(db, targetVols, {
        title: 'New collection task nearby',
        body: `${donation.foodName} — pickup at ${donation.pickupAddress.split(',')[0]}, delivery to ${ngo.orgName}.`,
        donationId: donation.id,
      });
      return donation;
    });
  }
  const { data } = await http.post(`/donations/${donationId}/accept`);
  return data;
}

export async function reject(donationId, ngo) {
  if (IS_MOCK) {
    await delay(250);
    return mutate((db) => {
      const donation = findDonation(db, donationId);
      if (donation.status !== STATUS.PENDING) {
        throw new Error('Only pending donations can be declined.');
      }
      donation.rejectedBy = [...(donation.rejectedBy || []), ngo.id];
      donation.updatedAt = nowISO();
      pushNotification(db, donation.donorId, {
        title: 'Donation declined',
        body: `${ngo.orgName} declined "${donation.foodName}". It remains visible to other NGOs.`,
        donationId: donation.id,
      });
      return donation;
    });
  }
  const { data } = await http.post(`/donations/${donationId}/reject`);
  return data;
}

export async function cancel(donationId, donor) {
  if (IS_MOCK) {
    await delay(250);
    return mutate((db) => {
      const donation = findDonation(db, donationId);
      if (donation.donorId !== donor.id) throw new Error('You can only cancel your own donations.');
      if (![STATUS.PENDING, STATUS.ACCEPTED, STATUS.VOLUNTEER_ASSIGNED].includes(donation.status)) {
        throw new Error('This donation can no longer be cancelled (food already picked up).');
      }
      transition(db, donation, STATUS.CANCELLED, donor.id, 'Cancelled by donor');
      const task = db.tasks.find((t) => t.id === donation.taskId);
      if (task && ![TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED].includes(task.status)) {
        task.status = TASK_STATUS.CANCELLED;
        task.updatedAt = nowISO();
        task.timeline.push({ status: TASK_STATUS.CANCELLED, at: nowISO(), by: donor.id, note: 'Donation cancelled' });
      }
      const affected = [donation.acceptedBy, donation.volunteerId].filter(Boolean);
      pushNotification(db, affected, {
        title: 'Donation cancelled',
        body: `${donor.orgName || donor.name} cancelled "${donation.foodName}".`,
        donationId: donation.id,
      });
      return donation;
    });
  }
  const { data } = await http.post(`/donations/${donationId}/cancel`);
  return data;
}

/** Final step: NGO confirms it physically received the food. */
export async function confirmReceipt(donationId, ngo) {
  if (IS_MOCK) {
    await delay(300);
    return mutate((db) => {
      const donation = findDonation(db, donationId);
      if (donation.acceptedBy !== ngo.id) throw new Error('Only the accepting NGO can confirm receipt.');
      if (donation.status !== STATUS.DELIVERED) {
        throw new Error('Receipt can only be confirmed after delivery.');
      }
      transition(db, donation, STATUS.COMPLETED, ngo.id, 'NGO confirmed receipt');
      const task = db.tasks.find((t) => t.id === donation.taskId);
      if (task) {
        task.status = TASK_STATUS.COMPLETED;
        task.updatedAt = nowISO();
        task.timeline.push({ status: TASK_STATUS.COMPLETED, at: nowISO(), by: ngo.id, note: 'NGO confirmed receipt' });
      }
      pushNotification(db, [donation.donorId, donation.volunteerId], {
        title: 'Donation completed ✅',
        body: `${ngo.orgName} confirmed receipt of "${donation.foodName}". Thank you for reducing food waste!`,
        donationId: donation.id,
      });
      return donation;
    });
  }
  const { data } = await http.post(`/donations/${donationId}/confirm-receipt`);
  return data;
}