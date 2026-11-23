import { Link } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import DonationForm from '../../components/donations/DonationForm';
import { DONOR_NAV } from './DonorDashboard';

export default function NewDonation() {
  return (
    <DashboardShell
      nav={DONOR_NAV}
      title="Register Surplus Food"
      subtitle="Your listing becomes instantly visible to verified NGOs nearby."
      actions={
        <Link to="/donor/donations" className="hidden sm:block">
          <span className="btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /> My donations</span>
        </Link>
      }
    >
      <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          List only food that is <strong>fit for human consumption</strong>. Set a realistic
          collection deadline — NGOs and volunteers rely on it to plan pickups.
        </p>
      </div>
      <DonationForm />
    </DashboardShell>
  );
}