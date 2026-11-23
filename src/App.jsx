import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { PageLoader } from './components/ui';
import { useAuth } from './context/AuthContext';
import { ROLE_HOME } from './lib/constants';

import Landing from './pages/public/Landing';
import About from './pages/public/About';
import Impact from './pages/public/Impact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Dashboards are code-split so the public site loads fast.
const DonorDashboard = lazy(() => import('./pages/donor/DonorDashboard'));
const NewDonation = lazy(() => import('./pages/donor/NewDonation'));
const MyDonations = lazy(() => import('./pages/donor/MyDonations'));

const NgoDashboard = lazy(() => import('./pages/ngo/NgoDashboard'));
const BrowseDonations = lazy(() => import('./pages/ngo/BrowseDonations'));
const AcceptedDonations = lazy(() => import('./pages/ngo/AcceptedDonations'));

const VolunteerDashboard = lazy(() => import('./pages/volunteer/VolunteerDashboard'));
const VolunteerHistory = lazy(() => import('./pages/volunteer/VolunteerHistory'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminDonations = lazy(() => import('./pages/admin/AdminDonations'));

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-hero-gradient px-4 text-center">
      <p className="font-display text-7xl font-extrabold text-forest-600">404</p>
      <h1 className="mt-3 font-display text-xl font-bold text-charcoal">This page went to waste</h1>
      <p className="mt-2 max-w-sm text-sm text-charcoal/60">
        The page you're looking for doesn't exist. Let's get you back to something useful.
      </p>
      <a href="/" className="btn-primary btn-md mt-6">Back to home</a>
    </div>
  );
}

/** Redirect logged-in users away from auth pages to their dashboard. */
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
}

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader label="Loading ShareBite…" />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Landing /></Page>} />
        <Route path="/about" element={<Page><About /></Page>} />
        <Route path="/impact" element={<Page><Impact /></Page>} />
        <Route path="/login" element={<GuestOnly><Page><Login /></Page></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Page><Register /></Page></GuestOnly>} />

        <Route path="/donor" element={<ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>} />
        <Route path="/donor/new" element={<ProtectedRoute role="donor"><NewDonation /></ProtectedRoute>} />
        <Route path="/donor/donations" element={<ProtectedRoute role="donor"><MyDonations /></ProtectedRoute>} />

        <Route path="/ngo" element={<ProtectedRoute role="ngo"><NgoDashboard /></ProtectedRoute>} />
        <Route path="/ngo/browse" element={<ProtectedRoute role="ngo"><BrowseDonations /></ProtectedRoute>} />
        <Route path="/ngo/accepted" element={<ProtectedRoute role="ngo"><AcceptedDonations /></ProtectedRoute>} />

        <Route path="/volunteer" element={<ProtectedRoute role="volunteer"><VolunteerDashboard /></ProtectedRoute>} />
        <Route path="/volunteer/history" element={<ProtectedRoute role="volunteer"><VolunteerHistory /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/donations" element={<ProtectedRoute role="admin"><AdminDonations /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </AnimatePresence>
    </Suspense>
  );
}