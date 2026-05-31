import { createContext, createElement, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, initialAuthUrlType, initialAuthToken } from './api';

export type UserRole = 'super_admin' | 'tenant_admin' | 'asset_manager' | 'finance_user' | 'read_only';

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isSuperAdmin: boolean;
  tenantId: string;
  tenantName: string;
  tenantLogoUrl: string | null;
  status: 'active' | 'invited' | 'disabled';
  lastLoginAt: string | null;
}

export interface AuthState {
  profile: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (data: { fullName?: string; email?: string; password?: string }) => Promise<void>;
  patchProfileState: (patch: Partial<UserProfile>) => void;
}

// ─── Demo mode ─────────────────────────────────────────────────────────────
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_TOKEN_KEY = 'bennnsam_demo_token';

// Credentials accepted in demo mode (any password works).
const DEMO_USERS: Record<string, UserProfile> = {
  'superadmin@bennnsam.local': {
    userId: '00000000-0000-0000-0000-000000000099',
    email: 'superadmin@bennnsam.local',
    fullName: 'Platform Super Admin',
    role: 'super_admin',
    isSuperAdmin: true,
    tenantId: '00000000-0000-0000-0000-000000000001',
    tenantName: 'BennnSAM Platform',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'ava.collins@demo.bennnsam.local': {
    userId: '30000000-0000-0000-0000-000000000001',
    email: 'ava.collins@demo.bennnsam.local',
    fullName: 'Ava Collins',
    role: 'tenant_admin',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000001',
    tenantName: 'Northstar Manufacturing',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'marcus.tan@demo.bennnsam.local': {
    userId: '30000000-0000-0000-0000-000000000002',
    email: 'marcus.tan@demo.bennnsam.local',
    fullName: 'Marcus Tan',
    role: 'asset_manager',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000001',
    tenantName: 'Northstar Manufacturing',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'priya.singh@demo.bennnsam.local': {
    userId: '30000000-0000-0000-0000-000000000003',
    email: 'priya.singh@demo.bennnsam.local',
    fullName: 'Priya Singh',
    role: 'finance_user',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000001',
    tenantName: 'Northstar Manufacturing',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'admin@acme.mining': {
    userId: '31000000-0000-0000-0000-000000000001',
    email: 'admin@acme.mining',
    fullName: 'Sarah Mitchell',
    role: 'tenant_admin',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000002',
    tenantName: 'Acme Mining',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'assets@acme.mining': {
    userId: '31000000-0000-0000-0000-000000000002',
    email: 'assets@acme.mining',
    fullName: 'Tom Nguyen',
    role: 'asset_manager',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000002',
    tenantName: 'Acme Mining',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'finance@acme.mining': {
    userId: '31000000-0000-0000-0000-000000000003',
    email: 'finance@acme.mining',
    fullName: 'Lisa Kaur',
    role: 'finance_user',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000002',
    tenantName: 'Acme Mining',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'viewer@acme.mining': {
    userId: '31000000-0000-0000-0000-000000000004',
    email: 'viewer@acme.mining',
    fullName: 'Jack Chen',
    role: 'read_only',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000002',
    tenantName: 'Acme Mining',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'admin@ecu.campus': {
    userId: '32000000-0000-0000-0000-000000000001',
    email: 'admin@ecu.campus',
    fullName: 'Dr. Anna Brennan',
    role: 'tenant_admin',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000003',
    tenantName: 'ECU City Campus',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'assets@ecu.campus': {
    userId: '32000000-0000-0000-0000-000000000002',
    email: 'assets@ecu.campus',
    fullName: 'James Okafor',
    role: 'asset_manager',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000003',
    tenantName: 'ECU City Campus',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'admin@donkey.billabong': {
    userId: '33000000-0000-0000-0000-000000000001',
    email: 'admin@donkey.billabong',
    fullName: 'Bruce Walters',
    role: 'tenant_admin',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000004',
    tenantName: 'Donkey Billabong',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  },
  'viewer@donkey.billabong': {
    userId: '33000000-0000-0000-0000-000000000002',
    email: 'viewer@donkey.billabong',
    fullName: 'Mei Lin',
    role: 'read_only',
    isSuperAdmin: false,
    tenantId: '00000000-0000-0000-0000-000000000004',
    tenantName: 'Donkey Billabong',
    tenantLogoUrl: null,
    status: 'active',
    lastLoginAt: null
  }
};

// Map demo email → the API token used by the backend demo auth.
const DEMO_EMAIL_TO_TOKEN: Record<string, string> = {
  'superadmin@bennnsam.local':         'demo-superadmin',
  'ava.collins@demo.bennnsam.local':   'demo-northstar-admin',
  'marcus.tan@demo.bennnsam.local':    'demo-northstar-assets',
  'priya.singh@demo.bennnsam.local':   'demo-northstar-finance',
  'admin@acme.mining':                 'demo-acme-admin',
  'assets@acme.mining':                'demo-acme-assets',
  'finance@acme.mining':               'demo-acme-finance',
  'admin@ecu.campus':                  'demo-ecu-admin',
  'admin@donkey.billabong':            'demo-donkey-admin',
};

// ─── Context ───────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthState>({
  profile: null,
  token: null,
  isLoading: true,
  isPasswordRecovery: false,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  updatePassword: async () => {},
  updateProfile: async () => {},
  patchProfileState: () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

// Convenience hook: returns true if user has one of the given roles (or is super admin).
export function useHasRole(...roles: UserRole[]): boolean {
  const { profile } = useAuth();
  if (!profile) return false;
  if (profile.isSuperAdmin) return true;
  return roles.includes(profile.role);
}

// ─── Provider factory (called from App.tsx) ─────────────────────────────────

export function createAuthProvider(): {
  AuthProvider: (props: { children: ReactNode }) => ReturnType<typeof createElement>;
} {
  function AuthProvider({ children }: { children: ReactNode }): ReturnType<typeof createElement> {
    const [profile, setProfile]             = useState<UserProfile | null>(null);
    const [token, setToken]                 = useState<string | null>(null);
    const [isLoading, setLoading]           = useState(true);
    // useState lazy initializer runs SYNCHRONOUSLY during the first render —
    // before Supabase's async init microtasks have cleaned the URL hash.
    // useEffect runs AFTER those microtasks, so window.location.hash is empty by then.
    const [isPasswordRecovery, setRecovery] = useState<boolean>(() => {
      if (initialAuthUrlType === 'recovery') return true;
      if (typeof window === 'undefined') return false;
      const h = new URLSearchParams(window.location.hash.substring(1));
      return h.get('type') === 'recovery' && !!h.get('access_token');
    });
    const [error, setError]                 = useState<string | null>(null);

    const hydrateFromToken = useCallback(async (accessToken: string) => {
      if (DEMO_MODE) {
        // In demo mode token IS the demo-key string; find the profile by reverse-mapping.
        const email = Object.entries(DEMO_EMAIL_TO_TOKEN).find(([, t]) => t === accessToken)?.[0];
        const p = email ? DEMO_USERS[email] ?? null : null;
        setProfile(p);
        setToken(p ? accessToken : null);
        return;
      }

      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
      let resp: Response;
      try {
        resp = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } catch {
        setProfile(null);
        setToken(null);
        throw new Error(`Cannot reach the BennnSAM API at ${apiBase}. Check VITE_API_URL or rebuild with demo mode.`);
      }
      if (!resp.ok) {
        setProfile(null);
        setToken(null);
        throw new Error(`Profile load failed (HTTP ${resp.status}). The API server may not be configured correctly.`);
      }
      const data = await resp.json() as Record<string, unknown>;
      setProfile({
        userId:        String(data.id ?? data.userId ?? ''),
        email:         String(data.email ?? ''),
        fullName:      String(data.full_name ?? data.fullName ?? ''),
        role:          (data.role as UserRole) ?? 'read_only',
        isSuperAdmin:  Boolean(data.is_super_admin ?? data.isSuperAdmin),
        tenantId:      String(data.tenant_id ?? data.tenantId ?? ''),
        tenantName:    String((data.tenant as Record<string, unknown>)?.name ?? data.tenantName ?? 'Unknown'),
        tenantLogoUrl: ((data.tenant as Record<string, unknown>)?.logo_url as string | null) ?? (data.tenantLogoUrl as string | null) ?? null,
        status:        (data.status as UserProfile['status']) ?? 'active',
        lastLoginAt:   data.last_login_at ? String(data.last_login_at) : null
      });
      setToken(accessToken);
    }, []);

    // Restore session on mount.
    useEffect(() => {
      async function restore() {
        setLoading(true);
        try {
          if (DEMO_MODE) {
            const saved = sessionStorage.getItem(DEMO_TOKEN_KEY);
            if (saved) await hydrateFromToken(saved).catch(() => { /* stale token */ });
          } else if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) await hydrateFromToken(session.access_token).catch(() => { /* stale session */ });
          } else {
            const saved = sessionStorage.getItem(DEMO_TOKEN_KEY);
            if (saved) await hydrateFromToken(saved).catch(() => { /* stale token */ });
          }
        } finally {
          setLoading(false);
        }
      }
      void restore();
    }, [hydrateFromToken]);

    // Listen for Supabase session changes.
    useEffect(() => {
      if (DEMO_MODE || !supabase) return;
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setRecovery(true);
        } else if (event === 'INITIAL_SESSION' && initialAuthUrlType === 'recovery') {
          // Supabase sometimes replays PASSWORD_RECOVERY as INITIAL_SESSION;
          // use the module-level capture since the hash is gone by now.
          setRecovery(true);
        } else if (event === 'USER_UPDATED') {
          setRecovery(false);
        }
        if (session?.access_token) {
          await hydrateFromToken(session.access_token).catch(() => { /* background refresh, ignore */ });
        } else {
          setProfile(null);
          setToken(null);
          setRecovery(false);
        }
      });
      return () => subscription.unsubscribe();
    }, [hydrateFromToken]);

    const signIn = useCallback(async (email: string, password: string) => {
      setError(null);
      const normalEmail = email.toLowerCase().trim();

      if (DEMO_MODE) {
        const demoProfile = DEMO_USERS[normalEmail];
        const demoToken   = DEMO_EMAIL_TO_TOKEN[normalEmail];
        if (!demoProfile || !password) {
          throw new Error('Invalid email or password.');
        }
        sessionStorage.setItem(DEMO_TOKEN_KEY, demoToken);
        setProfile(demoProfile);
        setToken(demoToken);
        return;
      }

      if (supabase) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: normalEmail, password });
        if (authError) throw new Error(authError.message);
        if (data.session?.access_token) await hydrateFromToken(data.session.access_token);
        return;
      }

      // API-only mode (no supabase client but server is running).
      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
      const resp = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalEmail, password })
      });
      const body = await resp.json() as Record<string, unknown>;
      if (!resp.ok) throw new Error(String(body.error ?? 'Login failed.'));
      const accessToken = String(body.accessToken);
      sessionStorage.setItem(DEMO_TOKEN_KEY, accessToken);
      await hydrateFromToken(accessToken);
    }, [hydrateFromToken]);

    const signOut = useCallback(async () => {
      if (DEMO_MODE) {
        sessionStorage.removeItem(DEMO_TOKEN_KEY);
      } else if (supabase) {
        await supabase.auth.signOut();
      } else {
        sessionStorage.removeItem(DEMO_TOKEN_KEY);
      }
      setProfile(null);
      setToken(null);
    }, []);

    const refreshProfile = useCallback(async () => {
      if (token) await hydrateFromToken(token).catch(() => { /* ignore background refresh failures */ });
    }, [token, hydrateFromToken]);

    const updateProfile = useCallback(async (data: { fullName?: string; email?: string; password?: string }) => {
      if (DEMO_MODE) {
        setProfile((prev) => prev ? {
          ...prev,
          ...(data.fullName !== undefined && { fullName: data.fullName }),
          ...(data.email !== undefined && { email: data.email }),
        } : prev);
        return;
      }
      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
      const resp = await fetch(`${apiBase}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!resp.ok) {
        const body = await resp.json() as Record<string, unknown>;
        throw new Error(String(body.error ?? 'Failed to update profile.'));
      }
      await refreshProfile();
    }, [token, refreshProfile]);

    const patchProfileState = useCallback((patch: Partial<UserProfile>) => {
      setProfile((prev) => prev ? { ...prev, ...patch } : prev);
    }, []);

    const updatePassword = useCallback(async (newPassword: string) => {
      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
      // Resolve the best available bearer token (state → Supabase session → initial URL capture).
      const bearerToken: string | null =
        token
        ?? (supabase ? (await supabase.auth.getSession()).data.session?.access_token ?? null : null)
        ?? initialAuthToken;

      if (!bearerToken) throw new Error('No active session. Please use the invitation link again.');

      if (supabase) {
        // Preferred: update directly via the Supabase JS client.
        const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
        if (updErr) throw new Error(updErr.message);
        // Activate account status.
        await fetch(`${apiBase}/auth/activate`, { method: 'POST', headers: { Authorization: `Bearer ${bearerToken}` } });
      } else {
        // Fallback: delegate password update to the API server (when browser Supabase
        // client is unavailable, e.g. VITE_SUPABASE_ANON_KEY not resolved by Vite).
        const resp = await fetch(`${apiBase}/auth/set-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearerToken}` },
          body: JSON.stringify({ password: newPassword })
        });
        if (!resp.ok) {
          const body = await resp.json() as Record<string, unknown>;
          throw new Error(String(body.error ?? 'Failed to set password.'));
        }
      }

      // Sign the user in by hydrating their profile with the recovery token.
      await hydrateFromToken(bearerToken);
      // Persist the token so the session survives a page refresh.
      sessionStorage.setItem('bennnsam_demo_token', bearerToken);
      setRecovery(false);
    }, [token, hydrateFromToken]);

    const value: AuthState = { profile, token, isLoading, isPasswordRecovery, error, signIn, signOut, refreshProfile, updatePassword, updateProfile, patchProfileState };

    return createElement(AuthContext.Provider, { value }, children);
  }

  return { AuthProvider };
}

// ─── Permission helpers ─────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:   'Super Admin',
  tenant_admin:  'Tenant Admin',
  asset_manager: 'Asset Manager',
  finance_user:  'Finance / Cloud Cost User',
  read_only:     'Read Only'
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin:   'Platform-wide access to all tenants and system administration.',
  tenant_admin:  'Full access to this organisation, including user management and settings.',
  asset_manager: 'Manage devices, software, licences, agents and SAM recommendations.',
  finance_user:  'View cloud cost dashboards, reports and financial recommendations.',
  read_only:     'View dashboards and reports. Cannot create, edit or delete anything.'
};

export function canManageUsers(role: UserRole, isSuperAdmin: boolean): boolean {
  return isSuperAdmin || role === 'tenant_admin';
}

export function canManageAgentKeys(role: UserRole, isSuperAdmin: boolean): boolean {
  return isSuperAdmin || role === 'tenant_admin';
}

export function canViewCloudCosts(role: UserRole, isSuperAdmin: boolean): boolean {
  return isSuperAdmin || role === 'tenant_admin' || role === 'finance_user';
}

export function canWrite(role: UserRole, isSuperAdmin: boolean): boolean {
  return isSuperAdmin || role === 'tenant_admin' || role === 'asset_manager';
}
