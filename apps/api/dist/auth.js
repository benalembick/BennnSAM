// Demo users for no-Supabase mode.
const DEMO_USERS = {
    'demo-superadmin': {
        userId: '00000000-0000-0000-0000-000000000099',
        tenantId: '00000000-0000-0000-0000-000000000001',
        role: 'super_admin',
        isSuperAdmin: true,
        email: 'superadmin@bennnsam.local',
        fullName: 'Platform Super Admin'
    },
    'demo-northstar-admin': {
        userId: '30000000-0000-0000-0000-000000000001',
        tenantId: '00000000-0000-0000-0000-000000000001',
        role: 'tenant_admin',
        isSuperAdmin: false,
        email: 'ava.collins@demo.bennnsam.local',
        fullName: 'Ava Collins'
    },
    'demo-northstar-assets': {
        userId: '30000000-0000-0000-0000-000000000002',
        tenantId: '00000000-0000-0000-0000-000000000001',
        role: 'asset_manager',
        isSuperAdmin: false,
        email: 'marcus.tan@demo.bennnsam.local',
        fullName: 'Marcus Tan'
    },
    'demo-northstar-finance': {
        userId: '30000000-0000-0000-0000-000000000003',
        tenantId: '00000000-0000-0000-0000-000000000001',
        role: 'finance_user',
        isSuperAdmin: false,
        email: 'priya.singh@demo.bennnsam.local',
        fullName: 'Priya Singh'
    },
    'demo-acme-admin': {
        userId: '31000000-0000-0000-0000-000000000001',
        tenantId: '00000000-0000-0000-0000-000000000002',
        role: 'tenant_admin',
        isSuperAdmin: false,
        email: 'admin@acme.mining',
        fullName: 'Sarah Mitchell'
    },
    'demo-acme-assets': {
        userId: '31000000-0000-0000-0000-000000000002',
        tenantId: '00000000-0000-0000-0000-000000000002',
        role: 'asset_manager',
        isSuperAdmin: false,
        email: 'assets@acme.mining',
        fullName: 'Tom Nguyen'
    },
    'demo-acme-finance': {
        userId: '31000000-0000-0000-0000-000000000003',
        tenantId: '00000000-0000-0000-0000-000000000002',
        role: 'finance_user',
        isSuperAdmin: false,
        email: 'finance@acme.mining',
        fullName: 'Lisa Kaur'
    },
    'demo-ecu-admin': {
        userId: '32000000-0000-0000-0000-000000000001',
        tenantId: '00000000-0000-0000-0000-000000000003',
        role: 'tenant_admin',
        isSuperAdmin: false,
        email: 'admin@ecu.campus',
        fullName: 'Dr. Anna Brennan'
    },
    'demo-donkey-admin': {
        userId: '33000000-0000-0000-0000-000000000001',
        tenantId: '00000000-0000-0000-0000-000000000004',
        role: 'tenant_admin',
        isSuperAdmin: false,
        email: 'admin@donkey.billabong',
        fullName: 'Bruce Walters'
    }
};
// Demo credentials → token mapping for POST /api/auth/login in demo mode.
export const DEMO_CREDENTIALS = {
    'superadmin@bennnsam.local': 'demo-superadmin',
    'ava.collins@demo.bennnsam.local': 'demo-northstar-admin',
    'marcus.tan@demo.bennnsam.local': 'demo-northstar-assets',
    'priya.singh@demo.bennnsam.local': 'demo-northstar-finance',
    'admin@acme.mining': 'demo-acme-admin',
    'assets@acme.mining': 'demo-acme-assets',
    'finance@acme.mining': 'demo-acme-finance',
    'admin@ecu.campus': 'demo-ecu-admin',
    'admin@donkey.billabong': 'demo-donkey-admin',
};
export function getAuth(res) {
    return res.locals.auth;
}
export function createRequireAuth(supabaseAdmin) {
    return async function requireAuth(req, res, next) {
        const token = extractBearerToken(req);
        if (!supabaseAdmin) {
            // Demo mode: the token IS the demo user key string.
            const user = token ? DEMO_USERS[token] : null;
            if (!user) {
                return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
            }
            res.locals.auth = user;
            return next();
        }
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
        }
        const { data: { user }, error: jwtError } = await supabaseAdmin.auth.getUser(token);
        if (jwtError || !user) {
            return res.status(401).json({ error: 'Invalid or expired session. Please log in again.', code: 'INVALID_SESSION' });
        }
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users_profile')
            .select('id, tenant_id, role, is_super_admin, status, full_name, email')
            .eq('id', user.id)
            .maybeSingle();
        if (profileError || !profile) {
            return res.status(403).json({ error: 'User profile not found. Contact your administrator.', code: 'NO_PROFILE' });
        }
        if (profile.status === 'disabled') {
            return res.status(403).json({ error: 'Your account has been disabled.', code: 'ACCOUNT_DISABLED' });
        }
        if (!profile.is_super_admin) {
            const { data: tenant } = await supabaseAdmin
                .from('tenants')
                .select('status')
                .eq('id', profile.tenant_id)
                .maybeSingle();
            if (tenant?.status === 'disabled') {
                return res.status(403).json({ error: 'Your organisation account is disabled.', code: 'TENANT_DISABLED' });
            }
        }
        res.locals.auth = {
            userId: user.id,
            tenantId: profile.tenant_id,
            role: profile.role,
            isSuperAdmin: profile.is_super_admin || false,
            email: profile.email,
            fullName: profile.full_name
        };
        return next();
    };
}
export function requireRole(...roles) {
    return (_req, res, next) => {
        const auth = getAuth(res);
        if (auth.isSuperAdmin)
            return next();
        if (!roles.includes(auth.role)) {
            return res.status(403).json({ error: 'You do not have permission to perform this action.', code: 'FORBIDDEN' });
        }
        return next();
    };
}
export function requireSuperAdmin(_req, res, next) {
    const auth = getAuth(res);
    if (!auth?.isSuperAdmin) {
        return res.status(403).json({ error: 'Super admin access required.', code: 'FORBIDDEN' });
    }
    return next();
}
export function updateDemoUser(userId, updates) {
    for (const user of Object.values(DEMO_USERS)) {
        if (user.userId === userId) {
            if (updates.fullName !== undefined)
                user.fullName = updates.fullName;
            if (updates.email !== undefined)
                user.email = updates.email;
            return;
        }
    }
}
function extractBearerToken(req) {
    const header = req.header('authorization') ?? '';
    const m = header.match(/^Bearer\s+(.+)$/i);
    return m?.[1]?.trim() ?? null;
}
