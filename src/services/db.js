// ---------------------------------------------------------------------------
// Mock database — the SINGLE shared data source for every role in demo mode.
// Persisted to localStorage (browser) or memory (tests), with a tiny pub/sub
// so all dashboards re-render whenever any role mutates the data.
//
// In production mode (VITE_API_MODE=flask) services bypass this module and
// talk to the Flask API through apiClient.js instead.
// ---------------------------------------------------------------------------
import { buildSeed, DEMO_PASSWORD } from '../data/seed';
import { uid, nowISO } from '../lib/utils';

const DB_KEY = 'sharebite_db_v1';
const SESSION_KEY = 'sharebite_session_v1';

// Storage adapter — localStorage in the browser, in-memory elsewhere.
function createStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('__sb_probe', '1');
      localStorage.removeItem('__sb_probe');
      return localStorage;
    }
  } catch {
    /* fall through to memory */
  }
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
}

const storage = createStorage();
const listeners = new Set();

let db = null;

function persist() {
  storage.setItem(DB_KEY, JSON.stringify(db));
}

function emit() {
  for (const fn of listeners) fn();
}

/** Load (or seed) the database. Idempotent. */
export function loadDb() {
  if (db) return db;
  const raw = storage.getItem(DB_KEY);
  if (raw) {
    try {
      db = JSON.parse(raw);
      // Normalize legacy/partial data so new Phase-2 fields always exist.
      db.users = db.users || [];
      db.donations = db.donations || [];
      db.tasks = db.tasks || [];
      db.notifications = db.notifications || [];
      db.credentials = db.credentials || {};
      db.users.forEach((u) => {
        if (u.latitude === undefined) u.latitude = null;
        if (u.longitude === undefined) u.longitude = null;
        if (u.serviceRadiusKm === undefined) u.serviceRadiusKm = 25;
        if (u.acceptedCategories === undefined) u.acceptedCategories = [];
        if (u.minQuantity === undefined) u.minQuantity = 0;
        if (u.maxQuantity === undefined) u.maxQuantity = 0;
      });
      db.donations.forEach((d) => {
        if (d.pickupLatitude === undefined) d.pickupLatitude = null;
        if (d.pickupLongitude === undefined) d.pickupLongitude = null;
        if (d.rejectedBy === undefined) d.rejectedBy = [];
      });
      db.tasks.forEach((t) => {
        if (t.declinedBy === undefined) t.declinedBy = [];
        if (t.distanceKm === undefined) t.distanceKm = 0;
      });
      return db;
    } catch {
      /* corrupted — reseed */
    }
  }
  db = { ...buildSeed(), credentials: {} };
  persist();
  return db;
}

/** Reset demo data back to the original seed. */
export function resetDb() {
  db = { ...buildSeed(), credentials: {} };
  persist();
  storage.removeItem(SESSION_KEY);
  emit();
}

export function getDb() {
  return loadDb();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Apply a mutation, persist and notify every subscriber. */
export function mutate(fn) {
  loadDb();
  const result = fn(db);
  persist();
  emit();
  return result;
}

// ---- Password hashing (never store plaintext) ------------------------------
// Demo-grade salted SHA-256 via Web Crypto. The Flask backend uses
// werkzeug's pbkdf2/scrypt hashing — this mock layer is clearly separated.

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password, salt) {
  return sha256(`${salt}::${password}`);
}

export async function setCredentials(userId, password) {
  const salt = uid('salt');
  const hash = await hashPassword(password, salt);
  mutate((d) => {
    d.credentials[userId] = { salt, hash };
  });
}

export async function verifyCredentials(userId, password) {
  loadDb();
  const cred = db.credentials[userId];
  if (!cred) {
    // Demo accounts share a known demo password until first login sets creds.
    const user = db.users.find((u) => u.id === userId);
    if (user?.demo && password === (user.demoPassword || DEMO_PASSWORD)) {
      await setCredentials(userId, password);
      return true;
    }
    return false;
  }
  const hash = await hashPassword(password, cred.salt);
  return hash === cred.hash;
}

// ---- Session ---------------------------------------------------------------

export function saveSession(userId) {
  storage.setItem(SESSION_KEY, JSON.stringify({ userId, at: nowISO() }));
}

export function readSession() {
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  storage.removeItem(SESSION_KEY);
}

// ---- Cross-tab sync --------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY && e.newValue) {
      try {
        db = JSON.parse(e.newValue);
        emit();
      } catch {
        /* ignore */
      }
    }
  });
}