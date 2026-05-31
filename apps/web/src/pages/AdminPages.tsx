import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Copy,
  Database,
  ImageIcon,
  KeyRound,
  Loader2,
  MailPlus,
  MonitorCheck,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  XCircle
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button, PageHeader, cardSurface } from '../components/ui';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api';
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  canManageAgentKeys,
  useAuth,
  type UserRole
} from '../lib/auth';
import { date } from '../lib/format';
import type { AgentKey, AgentUpload, CreatedAgentKey, Tenant, TenantUser } from '../lib/types';
import { AccessDeniedPage } from './LoginPage';

// ─── Shared helpers ─────────────────────────────────────────────────────────

function Panel({ title, icon: Icon, children, action }: {
  title: string;
  icon?: typeof Users;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={`${cardSurface} rounded-lg p-4`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-cyan-700" /> : null}
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    invited:  'bg-amber-50 text-amber-700 border-amber-200',
    disabled: 'bg-slate-100 text-slate-500 border-slate-200',
    trial:    'bg-blue-50 text-blue-700 border-blue-200'
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RoleSelect({ value, onChange, disabled }: {
  value: string;
  onChange: (v: UserRole) => void;
  disabled?: boolean;
}) {
  const roles: UserRole[] = ['tenant_admin', 'asset_manager', 'finance_user', 'read_only'];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as UserRole)}
        disabled={disabled}
        className="block w-full appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-60"
      >
        {roles.map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

// ─── Generic Users Panel ─────────────────────────────────────────────────────
// Shared by tenant admin page and super admin's per-tenant modal.
// basePath: '/admin' for tenant admin, '/superadmin/tenants/:id' for super admin.

function UsersPanel({ basePath, currentUserId }: {
  basePath: string;
  currentUserId: string;
}) {
  const [users, setUsers]             = useState<TenantUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showInvite, setShowInvite]   = useState(false);
  const [editUser, setEditUser]       = useState<TenantUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<TenantUser[]>(`${basePath}/users`);
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [basePath]);

  async function toggleStatus(user: TenantUser) {
    setActionError(null);
    try {
      const next = user.status === 'disabled' ? 'active' : 'disabled';
      await apiPatch(`${basePath}/users/${user.id}`, { status: next });
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function changeRole(user: TenantUser, role: UserRole) {
    setActionError(null);
    try {
      await apiPatch(`${basePath}/users/${user.id}`, { role });
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  return (
    <Panel
      title="Users"
      icon={Users}
      action={
        <div className="flex items-center gap-2">
          <Button icon={RefreshCw} onClick={load} size="sm" type="button" variant="ghost">Refresh</Button>
          <Button icon={MailPlus} onClick={() => setShowInvite(true)} size="sm" type="button" variant="primary">
            Invite user
          </Button>
        </div>
      }
    >
      {actionError ? (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />Loading users…
        </div>
      ) : error ? (
        <div className="py-4 text-sm text-red-600">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[1.5fr_1.5fr_1.2fr_1fr_1fr_auto] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Last login</span>
            <span>Actions</span>
          </div>
          {users.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-slate-500">No users found.</div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-[1.5fr_1.5fr_1.2fr_1fr_1fr_auto] items-center gap-3 border-t border-slate-100 px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-slate-800">{u.fullName}</span>
                <span className="truncate text-slate-600">{u.email}</span>
                <RoleSelect
                  value={u.role}
                  onChange={(r) => changeRole(u, r)}
                  disabled={u.id === currentUserId}
                />
                <StatusChip status={u.status} />
                <span className="text-slate-500">{u.lastLoginAt ? date(u.lastLoginAt) : 'Never'}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditUser(u)}
                    title="Edit user"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={u.id === currentUserId}
                    onClick={() => toggleStatus(u)}
                    title={u.status === 'disabled' ? 'Enable user' : 'Disable user'}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                  >
                    {u.status === 'disabled' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showInvite ? (
        <InviteUserModal
          basePath={basePath}
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); void load(); }}
        />
      ) : null}

      {editUser ? (
        <EditUserModal
          user={editUser}
          basePath={basePath}
          onClose={() => setEditUser(null)}
          onSuccess={() => { setEditUser(null); void load(); }}
        />
      ) : null}
    </Panel>
  );
}

// ─── Tenant Admin: User Management Page ────────────────────────────────────

export function UserManagementPage() {
  const { profile } = useAuth();

  if (!profile || (profile.role !== 'tenant_admin' && !profile.isSuperAdmin)) {
    return <AccessDeniedPage />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Organisation administration"
        title="User Management"
        description={`Manage users in ${profile.tenantName}. Only Tenant Admins can invite, edit or disable users.`}
      />

      <UsersPanel basePath="/admin" currentUserId={profile.userId} />

      <Panel title="Permission Roles" icon={ShieldCheck}>
        <div className="space-y-2">
          {(Object.entries(ROLE_LABELS) as [UserRole, string][])
            .filter(([r]) => r !== 'super_admin')
            .map(([role, label]) => (
              <div key={role} className="rounded-md border border-slate-200 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                  <StatusChip status={role === 'read_only' ? 'invited' : 'active'} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
            ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── Invite User Modal ──────────────────────────────────────────────────────

function InviteUserModal({ basePath, onClose, onSuccess }: {
  basePath: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [role, setRole]       = useState<UserRole>('read_only');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost(`${basePath}/users/invite`, { email, fullName: name, role });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Invite new user</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-700">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="jane@yourcompany.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <RoleSelect value={role} onChange={setRole} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading} icon={loading ? Loader2 : MailPlus}>
              {loading ? 'Sending invite…' : 'Send invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit User Modal ─────────────────────────────────────────────────────────

function EditUserModal({ user, basePath, onClose, onSuccess }: {
  user: TenantUser;
  basePath: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fullName, setFullName] = useState(user.fullName);
  const [role, setRole]         = useState<UserRole>(user.role as UserRole);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPatch(`${basePath}/users/${user.id}`, { fullName, role });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Edit user</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-700">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              disabled
              value={user.email}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <RoleSelect value={role} onChange={setRole} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading} icon={loading ? Loader2 : Pencil}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tenant Admin: Agent Keys ───────────────────────────────────────────────

export function AgentKeysPanel() {
  const { profile } = useAuth();
  const [keys, setKeys]           = useState<AgentKey[]>([]);
  const [loading, setLoading]     = useState(true);
  const [keyName, setKeyName]     = useState('');
  const [createdKey, setCreated]  = useState<CreatedAgentKey | null>(null);
  const [error, setError]         = useState<string | null>(null);

  async function loadKeys() {
    if (!canManageAgentKeys(profile?.role ?? 'read_only', profile?.isSuperAdmin ?? false)) return;
    setLoading(true);
    try {
      const data = await apiGet<AgentKey[]>('/admin/agent-keys');
      setKeys(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadKeys(); }, []);

  async function createKey() {
    if (!keyName.trim()) return;
    try {
      const data = await apiPost<CreatedAgentKey>('/admin/agent-keys', { name: keyName.trim() });
      setCreated(data);
      setKeyName('');
      void loadKeys();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function revokeKey(id: string) {
    try {
      await apiDelete(`/admin/agent-keys/${id}`);
      void loadKeys();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => null);
  }

  const activeKeys = keys.filter((k) => k.status === 'active');

  return (
    <Panel title="Agent Enrolment Keys" icon={KeyRound}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createKey()}
            placeholder="Key label (e.g. Perth HQ agents)"
          />
          <Button type="button" variant="primary" icon={Plus} onClick={createKey}>Generate key</Button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {createdKey ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-800">New API key — copy it now, it won't be shown again.</p>
            <div className="flex items-center gap-2 rounded bg-white px-2 py-1.5">
              <code className="min-w-0 flex-1 truncate text-xs text-slate-700">{createdKey.apiKey}</code>
              <button type="button" onClick={() => copyText(createdKey.apiKey)} className="shrink-0 rounded p-1 hover:bg-slate-100">
                <Copy className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
            <div className="flex items-start gap-2 rounded bg-slate-950 px-2 py-1.5 text-white">
              <code className="min-w-0 flex-1 break-all text-xs">{createdKey.installCommand}</code>
              <button type="button" onClick={() => copyText(createdKey.installCommand)} className="shrink-0 rounded p-1 hover:bg-white/10">
                <Copy className="h-3.5 w-3.5 text-slate-300" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[1.5fr_1.2fr_1fr_auto] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            <span>Name</span><span>Prefix</span><span>Last used</span><span>Status</span>
          </div>
          {loading ? (
            <div className="px-3 py-4 text-sm text-slate-500">Loading…</div>
          ) : activeKeys.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-500">No active agent keys. Generate one above.</div>
          ) : (
            activeKeys.map((k) => (
              <div key={k.id} className="grid grid-cols-[1.5fr_1.2fr_1fr_auto] items-center gap-3 border-t border-slate-100 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{k.name}</span>
                <code className="text-xs text-slate-600">{k.keyPrefix}</code>
                <span className="text-slate-500">{k.lastUsedAt ? date(k.lastUsedAt) : 'Never'}</span>
                <button type="button" title="Revoke key" onClick={() => revokeKey(k.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-slate-500">Keys are tenant-scoped and stored as hashes. Each key links agent uploads to your organisation.</p>
      </div>
    </Panel>
  );
}

// ─── Super Admin: Tenant Management ────────────────────────────────────────

export function SuperAdminPage() {
  const { profile } = useAuth();
  const [tenants, setTenants]             = useState<Tenant[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [showCreate, setCreate]           = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);
  const [managedTenant, setManagedTenant] = useState<Tenant | null>(null);

  if (!profile?.isSuperAdmin) return <AccessDeniedPage message="Super Admin access required." />;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Tenant[]>('/superadmin/tenants');
      setTenants(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function toggleTenantStatus(t: Tenant) {
    setActionError(null);
    try {
      const next = t.status === 'disabled' ? 'active' : 'disabled';
      await apiPatch(`/superadmin/tenants/${t.id}`, { status: next });
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Platform administration"
        title="Super Admin — Tenant Management"
        description="Create, configure and monitor all BennnSAM tenants. Only accessible to Super Admin users."
      />

      {actionError ? (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {actionError}
        </div>
      ) : null}

      <Panel
        title="All Tenants"
        icon={Building2}
        action={
          <div className="flex items-center gap-2">
            <Button icon={RefreshCw} onClick={load} size="sm" type="button" variant="ghost">Refresh</Button>
            <Button icon={Plus} onClick={() => setCreate(true)} size="sm" type="button" variant="primary">
              New tenant
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />Loading tenants…
          </div>
        ) : error ? (
          <div className="py-4 text-sm text-red-600">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200">
            <div className="grid grid-cols-[2fr_1fr_auto_auto_auto_auto] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Organisation</span>
              <span>Status</span>
              <span>Users</span>
              <span>Devices</span>
              <span>Agents</span>
              <span>Actions</span>
            </div>
            {tenants.map((t) => (
              <div key={t.id} className="grid grid-cols-[2fr_1fr_auto_auto_auto_auto] items-center gap-3 border-t border-slate-100 px-3 py-2.5 text-sm">
                <div>
                  <div className="font-semibold text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.slug}</div>
                </div>
                <StatusChip status={t.status} />
                <span className="text-slate-600">{t.userCount ?? 0}</span>
                <span className="text-slate-600">{t.deviceCount ?? 0}</span>
                <span className="text-slate-600">{t.agentCount ?? 0}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setManagedTenant(t)}
                    title="Manage users"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-cyan-700"
                  >
                    <UserCog className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTenantStatus(t)}
                    title={t.status === 'disabled' ? 'Enable tenant' : 'Disable tenant'}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {t.status === 'disabled' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Platform Statistics" icon={Database}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total tenants"    value={tenants.length} />
          <Stat label="Active tenants"   value={tenants.filter((t) => t.status === 'active').length} />
          <Stat label="Disabled tenants" value={tenants.filter((t) => t.status === 'disabled').length} />
        </div>
      </Panel>

      {showCreate ? (
        <CreateTenantModal
          onClose={() => setCreate(false)}
          onSuccess={() => { setCreate(false); void load(); }}
        />
      ) : null}

      {managedTenant ? (
        <TenantUsersModal
          tenant={managedTenant}
          currentUserId={profile.userId}
          onClose={() => setManagedTenant(null)}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${cardSurface} rounded-lg p-4`}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function CreateTenantModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName]   = useState('');
  const [slug, setSlug]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function deriveSlug(n: string) {
    return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost('/superadmin/tenants', { name: name.trim(), slug: slug.trim() });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Create new tenant</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-700">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Organisation name</label>
            <input
              required
              value={name}
              onChange={(e) => { setName(e.target.value); if (!slug) setSlug(deriveSlug(e.target.value)); }}
              className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">URL slug</label>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="block w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="acme-corp"
              pattern="[a-z0-9-]+"
            />
            <p className="mt-1 text-xs text-slate-500">Lowercase letters, numbers and hyphens only.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading} icon={loading ? Loader2 : UserCog}>
              {loading ? 'Creating…' : 'Create tenant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tenant Users Modal (Super Admin drill-down) ────────────────────────────

function TenantLogoSection({ tenant }: { tenant: Tenant }) {
  const [preview, setPreview] = useState<string | null>(tenant.logoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDirty = preview !== (tenant.logoUrl ?? null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) { setError('Image must be under 1 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiPatch(`/superadmin/tenants/${tenant.id}`, { logoUrl: preview });
      setSuccess('Logo updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiPatch(`/superadmin/tenants/${tenant.id}`, { logoUrl: null });
      setPreview(null);
      setSuccess('Logo removed.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Company Branding" icon={ImageIcon}>
      <div className="space-y-4">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
        ) : null}

        {preview ? (
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <img src={preview} alt="Logo preview" className="h-10 w-auto max-w-[180px] object-contain" />
            <div className="min-w-0 flex-1 text-xs text-slate-500">Preview</div>
            <button type="button" onClick={handleRemove} disabled={loading}
              className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50">
              Remove
            </button>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
            No logo set
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Choose image
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={handleFileChange} />
          </label>
          <span className="text-xs text-slate-500">PNG, JPG, WebP or SVG · Max 1 MB</span>
        </div>

        {isDirty ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setPreview(tenant.logoUrl ?? null); setError(null); setSuccess(null); }}>
              Discard
            </Button>
            <Button type="button" variant="primary" disabled={loading} icon={loading ? Loader2 : undefined} onClick={handleSave}>
              {loading ? 'Saving…' : 'Save logo'}
            </Button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function TenantUsersModal({ tenant, currentUserId, onClose }: {
  tenant: Tenant;
  currentUserId: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-cyan-700" />
            <div>
              <h2 className="text-base font-semibold text-slate-950">{tenant.name} — Manage</h2>
              <p className="text-xs text-slate-400">{tenant.slug}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <TenantLogoSection tenant={tenant} />
          <UsersPanel
            basePath={`/superadmin/tenants/${tenant.id}`}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Company Branding Panel ─────────────────────────────────────────────────

function CompanyBrandingPanel() {
  const { profile, patchProfileState } = useAuth();
  const [preview, setPreview]   = useState<string | null>(profile?.tenantLogoUrl ?? null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const savedUrl = profile?.tenantLogoUrl ?? null;
  const isDirty  = preview !== savedUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) { setError('Image must be under 1 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiPatch('/admin/tenant/logo', { logoUrl: preview });
      patchProfileState({ tenantLogoUrl: preview });
      setSuccess('Logo updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiPatch('/admin/tenant/logo', { logoUrl: null });
      setPreview(null);
      patchProfileState({ tenantLogoUrl: null });
      setSuccess('Logo removed.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Company Branding" icon={ImageIcon}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Upload your organisation's logo. It will appear in the top bar for all users in <span className="font-medium text-slate-700">{profile?.tenantName}</span>.
        </p>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
        ) : null}

        {preview ? (
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <img src={preview} alt="Logo preview" className="h-10 w-auto max-w-[180px] object-contain" />
            <div className="min-w-0 flex-1 text-xs text-slate-500">Preview</div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            No logo set
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          <span className="text-xs text-slate-500">PNG, JPG, WebP or SVG · Max 1 MB</span>
        </div>

        {isDirty ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setPreview(savedUrl); setSuccess(null); setError(null); }}>
              Discard
            </Button>
            <Button type="button" variant="primary" disabled={loading} icon={loading ? Loader2 : undefined} onClick={handleSave}>
              {loading ? 'Saving…' : 'Save logo'}
            </Button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

// ─── Agent Uploads Panel ────────────────────────────────────────────────────

export function AgentUploadsPanel() {
  const [uploads, setUploads] = useState<AgentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<AgentUpload[]>('/admin/agent-uploads');
      setUploads(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <Panel
      title="Agent Upload Log"
      icon={MonitorCheck}
      action={
        <Button icon={RefreshCw} onClick={load} size="sm" type="button" variant="ghost">Refresh</Button>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />Loading uploads…
        </div>
      ) : error ? (
        <div className="py-4 text-sm text-red-600">{error}</div>
      ) : uploads.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          No agent uploads yet. Run the agent with <code className="text-xs">-RunInitialScan</code> to send the first payload.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[1.6fr_1.2fr_0.9fr_0.9fr_1fr] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Hostname</span>
            <span>Device ID</span>
            <span>Apps</span>
            <span>Processes</span>
            <span>Received</span>
          </div>
          {uploads.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[1.6fr_1.2fr_0.9fr_0.9fr_1fr] items-center gap-3 border-t border-slate-100 px-3 py-2.5 text-sm"
            >
              <span className="font-medium text-slate-800 truncate">{u.hostname || '—'}</span>
              <code className="truncate text-xs text-slate-500">{u.deviceId || '—'}</code>
              <span className="text-slate-700">{u.installedApplicationCount.toLocaleString()}</span>
              <span className="text-slate-700">{u.runningProcessCount.toLocaleString()}</span>
              <span className="text-slate-500 text-xs">{new Date(u.receivedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-400">
        Showing the last {uploads.length} upload{uploads.length !== 1 ? 's' : ''} from agents enrolled to this organisation.
      </p>
    </Panel>
  );
}

// ─── Combined Admin Page ────────────────────────────────────────────────────

export function AdminPage({ globalSearch: _gs }: { globalSearch: string }) {
  const { profile } = useAuth();

  if (!profile) return <AccessDeniedPage message="You must be logged in to access this area." />;

  if (profile.isSuperAdmin) return <SuperAdminPage />;
  if (profile.role === 'tenant_admin') return <TenantAdminPage />;

  return <AccessDeniedPage message="Admin access requires the Tenant Admin role or higher." />;
}

function TenantAdminPage() {
  return (
    <div className="space-y-5">
      <UserManagementPage />
      <CompanyBrandingPanel />
      <AgentKeysPanel />
      <AgentUploadsPanel />
    </div>
  );
}
