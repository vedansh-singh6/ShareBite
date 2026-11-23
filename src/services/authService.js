// ---------------------------------------------------------------------------
// Auth service. Mock auth (salted SHA-256, localStorage session) is clearly
// separated from the production path (Flask + hashed passwords + JWT).
// No plaintext passwords are ever stored.
// ---------------------------------------------------------------------------
import { IS_MOCK, http, setAuthToken } from './apiClient';
import {
  getDb,
  mutate,
  setCredentials,
  verifyCredentials,
  saveSession,
  readSession,
  clearSession,
} from './db';
import { uid, nowISO, delay } from '../lib/utils';
import { ROLES } from '../lib/constants';

const TOKEN_KEY = 'sharebite_token_v1';

function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

export async function register(payload) {
  const { name, email, password, role, orgName, phone, address } = payload;
  if (IS_MOCK) {
    await delay(400);
    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    if (role === ROLES.ADMIN) {
      throw new Error('Admin accounts cannot be created from registration.');
    }
    const user = {
      id: uid('usr'),
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      address: address || '',
      active: true,
      createdAt: nowISO(),
      demo: false,
      ...(role === ROLES.DONOR ? { orgName: orgName || name, donorType: payload.donorType || 'individual' } : {}),
      ...(role === ROLES.NGO
        ? { orgName, registrationNumber: payload.registrationNumber || '', verified: false }
        : {}),
      ...(role === ROLES.VOLUNTEER ? { area: payload.area || '', vehicle: payload.vehicle || '' } : {}),
    };
    mutate((d) => {
      d.users.push(user);
    });
    await setCredentials(user.id, password);
    saveSession(user.id);
    return publicUser(user);
  }
  const { data } = await http.post('/auth/register', payload);
  setAuthToken(data.token);
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
}

export async function login(email, password) {
  if (IS_MOCK) {
    await delay(400);
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new Error('No account found with this email.');
    if (!user.active) throw new Error('This account has been deactivated. Contact the admin.');
    const ok = await verifyCredentials(user.id, password);
    if (!ok) throw new Error('Incorrect password. Please try again.');
    saveSession(user.id);
    return publicUser(user);
  }
  const { data } = await http.post('/auth/login', { email, password });
  setAuthToken(data.token);
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
}

export async function logout() {
  if (IS_MOCK) {
    clearSession();
    return;
  }
  setAuthToken(null);
  localStorage.removeItem(TOKEN_KEY);
}

/** Restore the current session on app load. */
export async function restoreSession() {
  if (IS_MOCK) {
    const session = readSession();
    if (!session) return null;
    const user = getDb().users.find((u) => u.id === session.userId);
    return user && user.active ? publicUser(user) : null;
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  setAuthToken(token);
  try {
    const { data } = await http.get('/auth/me');
    return data.user;
  } catch {
    setAuthToken(null);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export async function updateProfile(userId, patch) {
  if (IS_MOCK) {
    await delay(250);
    return mutate((db) => {
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error('User not found.');
      Object.assign(user, patch);
      return publicUser(user);
    });
  }
  const { data } = await http.patch('/users/me', patch);
  return data.user;
}