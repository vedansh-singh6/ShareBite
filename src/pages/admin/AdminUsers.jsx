import { useMemo, useState } from 'react';
import { Search, ShieldCheck, ShieldX, UserX, UserCheck, Building2 } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Card, Input, Tabs, Badge, Button, Avatar, ConfirmDialog, EmptyState } from '../../components/ui';
import { ADMIN_NAV } from './AdminDashboard';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import * as userService from '../../services/userService';
import { ROLE_LABELS } from '../../lib/constants';
import { formatDate, classNames } from '../../lib/utils';

const ROLE_TONES = { donor: 'green', ngo: 'blue', volunteer: 'violet', admin: 'amber' };

export default function AdminUsers() {
  const { users } = useData();
  const { toast } = useToast();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState(null); // { title, message, label, danger, run, success }
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    let list = users;
    if (tab === 'ngo') list = list.filter((u) => u.role === 'ngo');
    else if (tab !== 'all') list = list.filter((u) => u.role === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.orgName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, tab, query]);

  const askVerify = (ngo, verified) =>
    setConfirm({
      title: verified ? `Verify ${ngo.orgName}?` : `Revoke verification for ${ngo.orgName}?`,
      message: verified
        ? 'Verified NGOs can accept donations on the platform.'
        : 'This NGO will no longer be able to accept new donations.',
      label: verified ? 'Verify NGO' : 'Revoke',
      danger: !verified,
      run: () => userService.verifyNgo(ngo.id, verified),
      success: verified ? `${ngo.orgName} verified.` : 'Verification revoked.',
    });

  const askActive = (u, active) =>
    setConfirm({
      title: active ? `Reactivate ${u.name}?` : `Deactivate ${u.name}?`,
      message: active
        ? 'The user will be able to log in and use the platform again.'
        : 'The user will not be able to log in. Existing records are preserved.',
      label: active ? 'Reactivate' : 'Deactivate',
      danger: !active,
      run: () => userService.setActive(u.id, active),
      success: active ? 'User reactivated.' : 'User deactivated.',
    });

  const runConfirm = async () => {
    setBusy(true);
    try {
      await confirm.run();
      toast(confirm.success, 'success');
      setConfirm(null);
    } catch (err) {
      toast(err.message, 'error');
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell
      nav={ADMIN_NAV}
      title="Users & NGO Verification"
      subtitle="Manage accounts and verify organisations."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={[
            { value: 'all', label: 'All', count: users.length },
            { value: 'donor', label: 'Donors', count: users.filter((u) => u.role === 'donor').length },
            { value: 'ngo', label: 'NGOs', count: users.filter((u) => u.role === 'ngo').length },
            { value: 'volunteer', label: 'Volunteers', count: users.filter((u) => u.role === 'volunteer').length },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="relative sm:w-64">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
          <Input className="pl-10" placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search users" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No users match" message="Try a different search or tab." />
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.id} className={classNames('flex flex-wrap items-center gap-4 p-4', !u.active && 'opacity-60')}>
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-bold text-charcoal">{u.orgName || u.name}</p>
                  <Badge tone={ROLE_TONES[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  {u.role === 'ngo' && (
                    u.verified
                      ? <Badge tone="green"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                      : <Badge tone="amber"><ShieldX className="h-3 w-3" /> Unverified</Badge>
                  )}
                  {!u.active && <Badge tone="red">Deactivated</Badge>}
                  {u.demo && <Badge tone="gray">Demo</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-charcoal/55">
                  {u.name}{u.orgName ? ` · ${u.email}` : ` · ${u.email}`} · joined {formatDate(u.createdAt)}
                </p>
                {u.role === 'ngo' && u.registrationNumber && (
                  <p className="text-xs text-charcoal/45">Reg. no: {u.registrationNumber}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {u.role === 'ngo' && (
                  u.verified ? (
                    <Button size="sm" variant="secondary" icon={ShieldX} onClick={() => askVerify(u, false)}>Revoke</Button>
                  ) : (
                    <Button size="sm" icon={ShieldCheck} onClick={() => askVerify(u, true)}>Verify</Button>
                  )
                )}
                {u.role !== 'admin' && (
                  u.active ? (
                    <Button size="sm" variant="secondary" icon={UserX} onClick={() => askActive(u, false)}>Deactivate</Button>
                  ) : (
                    <Button size="sm" variant="secondary" icon={UserCheck} onClick={() => askActive(u, true)}>Reactivate</Button>
                  )
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => !busy && setConfirm(null)}
        onConfirm={runConfirm}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.label || 'Confirm'}
        danger={confirm?.danger}
        loading={busy}
      />
    </DashboardShell>
  );
}