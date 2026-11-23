// ---------------------------------------------------------------------------
// DataContext — exposes the shared database to every dashboard.
// In mock mode it subscribes to the mock DB's pub/sub, so a change made by
// one role (e.g. NGO accepting) instantly updates all other dashboards.
// In flask mode it polls the API on an interval + on window focus.
// ---------------------------------------------------------------------------
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { IS_MOCK } from '../services/apiClient';
import { subscribe, getDb, loadDb } from '../services/db';
import * as donationService from '../services/donationService';
import * as taskService from '../services/taskService';
import * as userService from '../services/userService';

const DataContext = createContext(null);

function useMockSnapshot() {
  // useSyncExternalStore needs a stable snapshot reference; the db object is
  // mutated in place, so we track a version counter instead.
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
  loadDb();
  return version;
}

export function DataProvider({ children }) {
  const version = useMockSnapshot();
  const [remote, setRemote] = useState({ donations: [], tasks: [], users: [], loading: true, error: null });

  const refreshRemote = useCallback(async () => {
    try {
      const [donations, tasks, users] = await Promise.all([
        donationService.getAll(),
        taskService.getAll(),
        userService.getAll().catch(() => []),
      ]);
      setRemote({ donations, tasks, users, loading: false, error: null });
    } catch (err) {
      setRemote((r) => ({ ...r, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    if (IS_MOCK) return;
    refreshRemote();
    const interval = setInterval(refreshRemote, 15000);
    const onFocus = () => refreshRemote();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshRemote]);

  const value = useMemo(() => {
    if (IS_MOCK) {
      const db = getDb();
      return {
        donations: db.donations,
        tasks: db.tasks,
        users: db.users,
        notifications: db.notifications,
        loading: false,
        error: null,
        version,
        refresh: () => {},
      };
    }
    return { ...remote, notifications: [], version: 0, refresh: refreshRemote };
  }, [version, remote, refreshRemote]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}

/** Lookup helpers bound to the live data. */
export function useLookups() {
  const { users } = useData();
  return {
    userById: (id) => users.find((u) => u.id === id) || null,
    orgName: (id) => {
      const u = users.find((x) => x.id === id);
      return u ? u.orgName || u.name : 'Unknown';
    },
  };
}