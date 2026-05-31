import { AlertTriangle, CheckCircle2, KeyRound, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import bennnSamLogo from '../assets/bennnsam-logo-cropped.png';
import { useAuth } from '../lib/auth';

interface Props {
  onSuccess: () => void;
}

const DEMO_ACCOUNTS = [
  { email: 'ava.collins@demo.bennnsam.local',  label: 'Northstar — Tenant Admin',  hint: 'Full access + user management' },
  { email: 'marcus.tan@demo.bennnsam.local',   label: 'Northstar — Asset Manager', hint: 'Devices, software, licences' },
  { email: 'priya.singh@demo.bennnsam.local',  label: 'Northstar — Finance User',  hint: 'Cloud cost dashboards' },
  { email: 'admin@acme.mining',                label: 'Acme Mining — Tenant Admin', hint: 'Separate tenant data' },
  { email: 'admin@ecu.campus',                 label: 'ECU City Campus — Admin',    hint: 'Separate tenant data' },
  { email: 'admin@donkey.billabong',           label: 'Donkey Billabong — Admin',   hint: 'Separate tenant data' },
  { email: 'superadmin@bennnsam.local',        label: 'Super Admin',                hint: 'Manage all tenants' }
];

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export function LoginPage({ onSuccess }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err) {
      setError((err as Error).message || 'Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('BennnSamDemo!2026');
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.12),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef6f8_100%)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img alt="BennnSam" className="h-12 w-auto object-contain" src={bennnSamLogo} />
          <p className="text-sm text-slate-500 text-center">
            SAM &amp; SaaS Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-200/80 bg-white/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
              Secure sign in
            </div>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to access your organisation's BennnSAM workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {error ? (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  className="block w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
                onClick={() => alert('Password reset is available in the live Supabase-connected environment. Contact your Tenant Admin or use the Supabase Auth dashboard.')}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-cyan-700 hover:to-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo accounts panel */}
        {DEMO_MODE ? (
          <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Demo accounts</div>
            <p className="mb-3 text-xs text-cyan-800">
              Click any account to pre-fill. Password: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-cyan-900">BennnSamDemo!2026</code>
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => quickLogin(acct.email)}
                  className="flex w-full items-start gap-2 rounded-md border border-cyan-200 bg-white px-3 py-2 text-left text-sm transition hover:border-cyan-400 hover:bg-cyan-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">{acct.label}</div>
                    <div className="truncate text-xs text-slate-500">{acct.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs text-slate-400">
          BennnSAM &copy; {new Date().getFullYear()} — Secure multi-tenant SAM &amp; FinOps platform
        </p>
      </div>
    </div>
  );
}

// ─── Set Password Page (shown after invite link is clicked) ─────────────────

export function SetPasswordPage() {
  const { updatePassword, profile } = useAuth();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setError(null);
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => { window.location.hash = 'dashboard'; }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const firstName = profile?.fullName?.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.12),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef6f8_100%)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img alt="BennnSam" className="h-12 w-auto object-contain" src={bennnSamLogo} />
          <p className="text-sm text-slate-500 text-center">SAM &amp; SaaS Intelligence Platform</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
              <KeyRound className="h-4 w-4" />
              Account setup
            </div>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
              {firstName ? `Welcome, ${firstName}!` : 'Welcome to BennnSAM!'}
            </h1>
            <p className="text-sm text-slate-500">
              Set a password to complete your account and access your workspace.
            </p>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="font-semibold text-slate-800">Password set — signing you in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {error ? (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="new-password">
                  New password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="block w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="confirm-password">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className="block w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-cyan-700 hover:to-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {loading ? 'Setting up account…' : 'Set password & sign in'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          BennnSAM &copy; {new Date().getFullYear()} — Secure multi-tenant SAM &amp; FinOps platform
        </p>
      </div>
    </div>
  );
}

export function AccessDeniedPage({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <ShieldCheck className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-950">Access Denied</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {message ?? 'You do not have permission to view this area. Contact your Tenant Admin if you believe this is an error.'}
      </p>
    </div>
  );
}

export function DisabledAccountPage({ isOrg }: { isOrg?: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-950">
        {isOrg ? 'Organisation Suspended' : 'Account Disabled'}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {isOrg
          ? "Your organisation's BennnSAM account has been suspended. Contact BennnSAM support for assistance."
          : 'Your user account has been disabled. Contact your Tenant Admin to restore access.'}
      </p>
    </div>
  );
}
