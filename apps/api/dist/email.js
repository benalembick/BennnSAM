import nodemailer from 'nodemailer';
const ROLE_NAMES = {
    super_admin: 'Super Admin',
    tenant_admin: 'Tenant Admin',
    asset_manager: 'Asset Manager',
    finance_user: 'Finance / Cloud Cost User',
    read_only: 'Read Only'
};
export function roleLabel(role) {
    return ROLE_NAMES[role] ?? role;
}
let _transporter = null;
function getTransporter() {
    if (_transporter)
        return _transporter;
    const host = process.env.SMTP_HOST;
    if (!host)
        return null;
    _transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
            : undefined
    });
    return _transporter;
}
export function smtpConfigured() {
    return Boolean(process.env.SMTP_HOST);
}
function buildInviteEmailHtml(opts) {
    const { fullName, tenantName, roleName, inviteUrl } = opts;
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>You've been invited to BennnSAM</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;border-radius:12px 12px 0 0;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;color:#22d3ee;letter-spacing:-0.5px;">Bennn</span><span style="font-size:22px;font-weight:800;color:#ffffff;">SAM</span>
                    <div style="font-size:11px;color:#94a3b8;margin-top:3px;letter-spacing:0.5px;">SAM &amp; SaaS Intelligence Platform</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.2;">You've been invited</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
                Hi <strong style="color:#0f172a;">${escHtml(fullName)}</strong>, you've been invited to join
                <strong style="color:#0f172a;">${escHtml(tenantName)}</strong> on <strong style="color:#0f172a;">BennnSAM</strong>
                — a Software Asset Management and SaaS Intelligence platform.
              </p>

              <!-- Role badge -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 18px;">
                    <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:3px;">Your role</div>
                    <div style="font-size:15px;font-weight:600;color:#0f172a;">${escHtml(roleName)}</div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:8px;background:#0891b2;">
                    <a href="${escAttr(inviteUrl)}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.1px;">
                      Accept invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">If the button doesn't work, paste this link into your browser:</p>
              <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
                ${escHtml(inviteUrl)}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                This invitation was sent by <strong>BennnSAM</strong> on behalf of ${escHtml(tenantName)}.
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                BennnSAM &copy; ${year} &mdash; Software Asset Management &amp; SaaS Intelligence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escAttr(s) {
    return s.replace(/"/g, '%22').replace(/'/g, '%27');
}
export async function sendInviteEmail(opts) {
    const t = getTransporter();
    if (!t)
        throw new Error('SMTP not configured — set SMTP_HOST in your environment.');
    const roleName = roleLabel(opts.role);
    const from = process.env.SMTP_FROM ?? `BennnSAM <noreply@bennnsam.com>`;
    const subject = `You've been invited to join ${opts.tenantName} on BennnSAM`;
    const html = buildInviteEmailHtml({
        fullName: opts.fullName,
        tenantName: opts.tenantName,
        roleName,
        inviteUrl: opts.inviteUrl
    });
    await t.sendMail({ from, to: opts.to, subject, html });
}
