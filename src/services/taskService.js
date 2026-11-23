// ---------------------------------------------------------------------------
// Collection task service — volunteer workflow (no OTP).
// Tasks are created automatically when an NGO accepts a donation.
// ---------------------------------------------------------------------------
import { IS_MOCK, http } from './apiClient';
import { getDb, mutate } from './db';
import { STATUS, TASK_STATUS } from '../lib/constants';
import { uid, nowISO, delay } from '../lib/utils';
import { pushNotification } from './notificationService';

function findTask(db, id) {
  const task = db.tasks.find((t) => t.id === id);
  if (!task) throw new Error('Collection task not found.');
  return task;
}

function taskTransition(db, task, status, by, note) {
  task.status = status;
  task.updatedAt = nowISO();
  task.timeline.push({ status, at: nowISO(), by, note });
}

function donationTransition(db, donation, status, by, note) {
  donation.status = status;
  donation.updatedAt = nowISO();
  donation.timeline.push({ status, at: nowISO(), by, note });
}

// ---- Queries ---------------------------------------------------------------

export async function getAll() {
  if (IS_MOCK) {
    await delay(180);
    return [...getDb().tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data } = await http.get('/tasks');
  return data;
}

export async function getOpen() {
  const all = await getAll();
  return all.filter((t) => t.status === TASK_STATUS.OPEN).map((t) => ({
    ...t,
    declinedBy: t.declinedBy || [],
    distanceKm: t.distanceKm || 0,
  }));
}

export async function getAvailableForVolunteer(volunteerId) {
  const open = await getOpen();
  return open.filter((t) => !(t.declinedBy || []).includes(volunteerId));
}

export async function getForVolunteer(volunteerId) {
  const all = await getAll();
  return all.filter((t) => t.volunteerId === volunteerId);
}

export async function getByDonation(donationId) {
  const all = await getAll();
  return all.find((t) => t.donationId === donationId) || null;
}

// ---- Commands --------------------------------------------------------------

export async function acceptTask(taskId, volunteer) {
  if (IS_MOCK) {
    await delay(300);
    return mutate((db) => {
      const task = findTask(db, taskId);
      if (task.status !== TASK_STATUS.OPEN) {
        throw new Error('This task has already been taken by another volunteer.');
      }
      const donation = db.donations.find((d) => d.id === task.donationId);
      if (!donation || donation.status !== STATUS.ACCEPTED) {
        throw new Error('This donation is no longer awaiting collection.');
      }
      task.volunteerId = volunteer.id;
      task.declinedBy = task.declinedBy || [];
      task.distanceKm = task.distanceKm || 0;
      taskTransition(db, task, TASK_STATUS.ASSIGNED, volunteer.id, `${volunteer.name} accepted the task`);
      donation.volunteerId = volunteer.id;
      donationTransition(db, donation, STATUS.VOLUNTEER_ASSIGNED, volunteer.id, `${volunteer.name} accepted the collection task`);
      pushNotification(db, [donation.acceptedBy, donation.donorId], {
        title: 'Volunteer assigned',
        body: `${volunteer.name} will collect "${donation.foodName}" and deliver it.`,
        donationId: donation.id,
      });
      return task;
    });
  }
  const { data } = await http.post(`/tasks/${taskId}/accept`);
  return data;
}

export async function declineTask(taskId, volunteer) {
  if (IS_MOCK) {
    await delay(200);
    return mutate((db) => {
      const task = findTask(db, taskId);
      if (task.status !== TASK_STATUS.OPEN) throw new Error('This task is no longer open.');
      task.declinedBy = [...(task.declinedBy || []), volunteer.id];
      task.updatedAt = nowISO();
      task.timeline.push({ status: task.status, at: nowISO(), by: volunteer.id, note: 'Declined by volunteer' });
      return task;
    });
  }
  const { data } = await http.post(`/tasks/${taskId}/decline`);
  return data;
}

const TASK_TRANSITIONS = {
  open: ['assigned'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['delivered', 'cancelled'],
  delivered: ['completed'],
};

export async function updateTaskStatus(taskId, volunteer, newStatus) {
  if (IS_MOCK) {
    await delay(250);
    return mutate((db) => {
      const task = findTask(db, taskId);
      if (task.volunteerId !== volunteer.id) throw new Error('This is not your task.');
      if (!(TASK_TRANSITIONS[task.status] || []).includes(newStatus)) {
        throw new Error(`Cannot move task from ${task.status} to ${newStatus}.`);
      }
      const donation = db.donations.find((d) => d.id === task.donationId);
      if (newStatus === 'picked_up') {
        taskTransition(db, task, TASK_STATUS.PICKED_UP, volunteer.id, 'Pickup confirmed at donor location');
        donationTransition(db, donation, STATUS.PICKED_UP, volunteer.id, 'Pickup confirmed at donor location');
      } else if (newStatus === 'delivered') {
        const ngo = db.users.find((u) => u.id === donation.acceptedBy);
        const name = ngo?.orgName || 'NGO';
        taskTransition(db, task, TASK_STATUS.DELIVERED, volunteer.id, `Delivered to ${name}`);
        donationTransition(db, donation, STATUS.DELIVERED, volunteer.id, `Delivered to ${name}`);
      } else if (newStatus === 'cancelled') {
        taskTransition(db, task, TASK_STATUS.CANCELLED, volunteer.id, 'Cancelled by volunteer');
        donationTransition(db, donation, STATUS.CANCELLED, volunteer.id, 'Cancelled by volunteer');
      }
      return task;
    });
  }
  const { data } = await http.patch(`/tasks/${taskId}/status`, { status: newStatus });
  return data;
}

export async function confirmPickup(taskId, volunteer) {
  if (IS_MOCK) {
    await delay(300);
    return mutate((db) => {
      const task = findTask(db, taskId);
      if (task.volunteerId !== volunteer.id) throw new Error('This is not your task.');
      if (task.status !== TASK_STATUS.ASSIGNED) throw new Error('Pickup can only be confirmed for assigned tasks.');
      const donation = db.donations.find((d) => d.id === task.donationId);
      taskTransition(db, task, TASK_STATUS.PICKED_UP, volunteer.id, 'Pickup confirmed at donor location');
      donationTransition(db, donation, STATUS.PICKED_UP, volunteer.id, 'Pickup confirmed at donor location');
      pushNotification(db, [donation.donorId, donation.acceptedBy], {
        title: 'Food picked up',
        body: `${volunteer.name} collected "${donation.foodName}" and is on the way.`,
        donationId: donation.id,
      });
      return task;
    });
  }
  const { data } = await http.post(`/tasks/${taskId}/pickup`);
  return data;
}

export async function confirmDelivery(taskId, volunteer) {
  if (IS_MOCK) {
    await delay(300);
    return mutate((db) => {
      const task = findTask(db, taskId);
      if (task.volunteerId !== volunteer.id) throw new Error('This is not your task.');
      if (task.status !== TASK_STATUS.PICKED_UP) throw new Error('Delivery can only be confirmed after pickup.');
      const donation = db.donations.find((d) => d.id === task.donationId);
      const ngo = db.users.find((u) => u.id === donation.acceptedBy);
      taskTransition(db, task, TASK_STATUS.DELIVERED, volunteer.id, `Delivered to ${ngo?.orgName || 'NGO'}`);
      donationTransition(db, donation, STATUS.DELIVERED, volunteer.id, `Delivered to ${ngo?.orgName || 'NGO'}`);
      pushNotification(db, donation.acceptedBy, {
        title: 'Delivery awaiting confirmation',
        body: `"${donation.foodName}" was delivered. Please confirm receipt to complete the donation.`,
        donationId: donation.id,
      });
      pushNotification(db, donation.donorId, {
        title: 'Your donation was delivered',
        body: `"${donation.foodName}" reached ${ngo?.orgName || 'the NGO'}.`,
        donationId: donation.id,
      });
      return task;
    });
  }
  const { data } = await http.post(`/tasks/${taskId}/deliver`);
  return data;
}