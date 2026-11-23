// ---------------------------------------------------------------------------
// User service — admin management + profile lookups.
// ---------------------------------------------------------------------------
import { IS_MOCK, http } from './apiClient';
import { getDb, mutate } from './db';
import { delay } from '../lib/utils';
import { pushNotification } from './notificationService';

export async function getAll() {
  if (IS_MOCK) {
    await delay(180);
    return [...getDb().users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data } = await http.get('/users');
  return data;
}

export async function getById(id) {
  if (IS_MOCK) {
    return getDb().users.find((u) => u.id === id) || null;
  }
  const { data } = await http.get(`/users/${id}`);
  return data;
}

export async function verifyNgo(ngoId, verified) {
  if (IS_MOCK) {
    await delay(250);
    return mutate((db) => {
      const ngo = db.users.find((u) => u.id === ngoId && u.role === 'ngo');
      if (!ngo) throw new Error('NGO not found.');
      ngo.verified = verified;
      pushNotification(db, ngo.id, {
        title: verified ? 'NGO verified ✅' : 'Verification revoked',
        body: verified
          ? 'Your organisation is verified. You can now accept donations.'
          : 'Your verification was revoked by the admin. Contact support for details.',
      });
      return ngo;
    });
  }
  const { data } = await http.post(`/users/${ngoId}/verify`, { verified });
  return data;
}

export async function setActive(userId, active) {
  if (IS_MOCK) {
    await delay(250);
    return mutate((db) => {
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error('User not found.');
      if (user.role === 'admin') throw new Error('Admin accounts cannot be deactivated.');
      user.active = active;
      return user;
    });
  }
  const { data } = await http.post(`/users/${userId}/active`, { active });
  return data;
}