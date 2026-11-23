import { motion } from 'framer-motion';
import { MapPin, Clock, Users, UtensilsCrossed } from 'lucide-react';
import { Card, StatusBadge, DietBadge, Badge } from '../ui';
import { CATEGORY_LABELS, STATUS } from '../../lib/constants';
import { formatQuantity, timeLeft, timeAgo, classNames } from '../../lib/utils';
import { useLookups } from '../../context/DataContext';

export default function DonationCard({ donation, onClick, index = 0, compact = false, distanceKm }) {
  const { orgName } = useLookups();
  const left = timeLeft(donation.availableUntil);
  const expired = left.expired && donation.status === STATUS.PENDING;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35 }}
    >
      <Card
        hover
        className={classNames('cursor-pointer overflow-hidden', expired && 'opacity-70')}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
        aria-label={`View donation: ${donation.foodName}`}
      >
        {!compact && (
          <div className="relative h-36 overflow-hidden bg-mint">
            {donation.imageUrl ? (
              <img
                src={donation.imageUrl}
                alt={donation.foodName}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-forest-300">
                <UtensilsCrossed className="h-10 w-10" />
              </div>
            )}
            <div className="absolute left-3 top-3 flex gap-2">
              <StatusBadge status={donation.status} />
            </div>
            {donation.demo && (
              <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600 backdrop-blur">
                Demo
              </span>
            )}
          </div>
        )}
        <div className="space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-sm font-bold leading-snug text-charcoal line-clamp-2">
              {donation.foodName}
            </h3>
            {compact && <StatusBadge status={donation.status} />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <DietBadge diet={donation.diet} />
            <Badge tone="gray">{CATEGORY_LABELS[donation.category] || donation.category}</Badge>
          </div>
          <div className="space-y-1.5 text-xs text-charcoal/60">
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-forest-500" />
              <span className="font-semibold text-charcoal/80">{formatQuantity(donation.quantity, donation.unit)}</span>
              · {orgName(donation.donorId)}
            </p>
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-forest-500" />
              <span className="truncate">{donation.pickupAddress}</span>
            </p>
            <p
              className={classNames(
                'flex items-center gap-1.5 font-semibold',
                expired ? 'text-red-500' : left.urgent ? 'text-orange-600' : 'text-forest-600'
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {donation.status === STATUS.PENDING ? left.text : `Updated ${timeAgo(donation.updatedAt)}`}
            </p>
            {distanceKm !== undefined && distanceKm !== null && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-charcoal/60">
                <MapPin className="h-3.5 w-3.5 text-forest-500" />
                {distanceKm} km from you
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}