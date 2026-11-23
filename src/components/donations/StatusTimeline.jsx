import { Check, Circle, XCircle, Ban } from 'lucide-react';
import { STATUS_FLOW, STATUS_META, STATUS } from '../../lib/constants';
import { formatDateTime, classNames } from '../../lib/utils';
import { useLookups } from '../../context/DataContext';

/** Vertical pipeline timeline derived from the donation's actual event log. */
export default function StatusTimeline({ donation }) {
  const { orgName, userById } = useLookups();
  const terminal =
    donation.status === STATUS.CANCELLED
      ? 'cancelled'
      : donation.status === STATUS.REJECTED
        ? 'rejected'
        : null;

  const reachedIdx = STATUS_FLOW.indexOf(donation.status);
  const events = Object.fromEntries(donation.timeline.map((t) => [t.status, t]));

  const nameOf = (id) => {
    const u = userById(id);
    return u ? u.orgName || u.name : 'System';
  };

  return (
    <ol className="space-y-0" aria-label="Donation progress">
      {STATUS_FLOW.map((status, i) => {
        const event = events[status];
        const done = Boolean(event);
        const current = donation.status === status && !terminal;
        return (
          <li key={status} className="relative flex gap-3 pb-5 last:pb-0">
            {i < STATUS_FLOW.length - 1 && (
              <span
                className={classNames(
                  'absolute left-[11px] top-6 h-full w-0.5',
                  done && events[STATUS_FLOW[i + 1]] ? 'bg-forest-400' : 'bg-charcoal/10'
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={classNames(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                done
                  ? 'border-forest-500 bg-forest-500 text-white'
                  : current
                    ? 'border-forest-400 bg-mint text-forest-600'
                    : 'border-charcoal/15 bg-white text-charcoal/25'
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={classNames(
                  'font-display text-sm font-semibold',
                  done ? 'text-charcoal' : 'text-charcoal/40'
                )}
              >
                {STATUS_META[status].label}
                {current && (
                  <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase text-forest-700">
                    Current
                  </span>
                )}
              </p>
              {event ? (
                <p className="text-xs text-charcoal/50">
                  {formatDateTime(event.at)} · {nameOf(event.by)}
                  {event.note && <span className="block text-charcoal/40">{event.note}</span>}
                </p>
              ) : (
                <p className="text-xs text-charcoal/35">{STATUS_META[status].hint}</p>
              )}
            </div>
          </li>
        );
      })}
      {terminal && (
        <li className="relative flex gap-3 pt-1">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
            {terminal === 'cancelled' ? <Ban className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-red-600">{STATUS_META[terminal].label}</p>
            <p className="text-xs text-charcoal/50">
              {formatDateTime(donation.updatedAt)} · {nameOf(donation.timeline[donation.timeline.length - 1]?.by)}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}