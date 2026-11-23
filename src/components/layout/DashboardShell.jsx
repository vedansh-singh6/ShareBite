import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, Menu, X, ChevronDown, RotateCcw, CheckCheck } from 'lucide-react';
import Logo from './Logo';
import { Avatar, Badge, Button, DemoBadge } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import * as notificationService from '../../services/notificationService';
import { resetDb } from '../../services/db';
import { IS_MOCK } from '../../services/apiClient';
import { ROLE_LABELS } from '../../lib/constants';
import { classNames, timeAgo } from '../../lib/utils';

function NotificationBell() {
  const { user } = useAuth();
  const { notifications } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const mine = notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2.5 text-charcoal/60 transition-colors hover:bg-forest-50 hover:text-forest-700"
        aria-label={`Notifications (${unread} unread)`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-charcoal">
            {unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-charcoal/5 bg-white shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-charcoal/5 px-4 py-3">
              <p className="font-display text-sm font-bold">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={() => notificationService.markAllRead(user.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-forest-600 hover:text-forest-700"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {mine.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-charcoal/45">No notifications yet.</p>
              ) : (
                mine.slice(0, 15).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => notificationService.markRead(n.id)}
                    className={classNames(
                      'block w-full border-b border-charcoal/5 px-4 py-3 text-left transition-colors hover:bg-forest-50/50',
                      !n.read && 'bg-mint/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-charcoal">{n.title}</p>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-charcoal/60">{n.body}</p>
                    <p className="mt-1 text-[11px] text-charcoal/40">{timeAgo(n.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardShell({ nav, title, subtitle, actions, children }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast('You have been logged out.', 'info');
    navigate('/');
  };

  const handleReset = () => {
    resetDb();
    toast('Demo data has been reset to its original state.', 'info');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Dashboard navigation">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 font-display text-sm font-semibold transition-all',
                isActive
                  ? 'bg-forest-600 text-white shadow-soft'
                  : 'text-charcoal/65 hover:bg-forest-50 hover:text-forest-700'
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 border-t border-charcoal/5 p-4">
        {IS_MOCK && (
          <button
            onClick={handleReset}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-charcoal/50 hover:bg-peach/40 hover:text-orange-700"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
          </button>
        )}
        <div className="flex items-center gap-3 rounded-xl bg-cream p-3">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-charcoal">{user.orgName || user.name}</p>
            <p className="text-xs text-charcoal/50">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-charcoal/5 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lift lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-full p-1.5 text-charcoal/40 hover:bg-charcoal/5"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-charcoal/5 bg-cream/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              className="rounded-xl p-2 text-charcoal/60 hover:bg-forest-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-lg font-bold text-charcoal">{title}</h1>
                {IS_MOCK && <DemoBadge className="hidden sm:inline-flex" />}
              </div>
              {subtitle && <p className="hidden truncate text-xs text-charcoal/50 sm:block">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              {actions}
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenu((o) => !o)}
                  className="flex items-center gap-2 rounded-full p-1.5 hover:bg-forest-50"
                  aria-label="Account menu"
                  aria-expanded={userMenu}
                >
                  <Avatar name={user.name} size="sm" />
                  <ChevronDown className="hidden h-4 w-4 text-charcoal/40 sm:block" />
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-charcoal/5 bg-white shadow-lift"
                    >
                      <div className="border-b border-charcoal/5 px-4 py-3">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-charcoal/50">{user.email}</p>
                        <Badge tone="green" className="mt-2">{ROLE_LABELS[user.role]}</Badge>
                      </div>
                      <Link
                        to="/"
                        className="block px-4 py-2.5 text-sm text-charcoal/70 hover:bg-forest-50"
                        onClick={() => setUserMenu(false)}
                      >
                        Public website
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}