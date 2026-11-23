import { Link } from 'react-router-dom';
import { classNames } from '../../lib/utils';

export default function Logo({ light = false, className }) {
  return (
    <Link to="/" className={classNames('flex items-center gap-2.5', className)} aria-label="ShareBite home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 3c-3.5 2.6-5.5 5.2-5.5 8.2a5.5 5.5 0 0 0 11 0C17.5 8.2 15.5 5.6 12 3z"
            fill="#DDF3E4"
          />
          <path d="M12 7v10M12 10.5l-2.4-2M12 13l2.4-2" stroke="#236B4E" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className={classNames('font-display text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-charcoal')}>
        Share<span className="text-forest-600">Bite</span>
      </span>
    </Link>
  );
}