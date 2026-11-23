import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import Logo from './Logo';
import { Button } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../lib/constants';
import { classNames } from '../../lib/utils';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'About', to: '/about' },
  { label: 'Impact', to: '/impact' },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const goHash = (to) => {
    if (to.startsWith('/#')) {
      const id = to.slice(2);
      if (location.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/', { state: { scrollTo: id } });
      }
    } else {
      navigate(to);
    }
    setOpen(false);
  };

  return (
    <header
      className={classNames(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass shadow-soft' : 'bg-transparent'
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {LINKS.map((l) =>
            l.to.startsWith('/#') ? (
              <button
                key={l.label}
                onClick={() => goHash(l.to)}
                className="rounded-full px-4 py-2 font-display text-sm font-semibold text-charcoal/70 transition-colors hover:bg-forest-50 hover:text-forest-700"
              >
                {l.label}
              </button>
            ) : (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  classNames(
                    'rounded-full px-4 py-2 font-display text-sm font-semibold transition-colors',
                    isActive ? 'bg-forest-50 text-forest-700' : 'text-charcoal/70 hover:bg-forest-50 hover:text-forest-700'
                  )
                }
              >
                {l.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button icon={LayoutDashboard} onClick={() => navigate(ROLE_HOME[user.role])}>
              My Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button onClick={() => navigate('/register')}>Get Started</Button>
            </>
          )}
        </div>
        <button
          className="rounded-xl p-2 text-charcoal md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass overflow-hidden border-t border-white/40 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="container-page flex flex-col gap-1 py-4">
              {LINKS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => goHash(l.to)}
                  className="rounded-xl px-4 py-3 text-left font-display text-sm font-semibold text-charcoal/80 hover:bg-forest-50"
                >
                  {l.label}
                </button>
              ))}
              <div className="mt-2 flex gap-2 px-2">
                {user ? (
                  <Button className="flex-1" onClick={() => navigate(ROLE_HOME[user.role])}>
                    My Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" className="flex-1" onClick={() => navigate('/login')}>
                      Login
                    </Button>
                    <Button className="flex-1" onClick={() => navigate('/register')}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}