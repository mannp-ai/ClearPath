import nodemailer from 'nodemailer';
import { requireUrl } from '../config/urls';

export type MailProviderType = 'gmail_oauth2' | 'smtp' | 'test';

function getProvider(): MailProviderType {
  const p = (process.env.MAIL_PROVIDER || '').toLowerCase();
  if (p === 'gmail' || p === 'gmail_oauth2') return 'gmail_oauth2';
  if (p === 'test' || p === 'stream') return 'test';
  if (process.env.GMAIL_USER && process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN) {
    return 'gmail_oauth2';
  }
  return 'smtp';
}

function createTransport(): nodemailer.Transporter {
  const provider = getProvider();

  if (provider === 'gmail_oauth2') {
    const user = process.env.GMAIL_USER;
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!user || !clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Gmail OAuth2 requires GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN',
      );
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  if (provider === 'test') {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  // Default: Standard SMTP
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      'Email provider not configured. Configure SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) or Gmail OAuth2 (GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).',
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function actionUrl(path: string, token: string): string {
  const baseUrl = requireUrl('FRONTEND_URL', 'http://localhost:3000');
  const url = new URL(path, baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

function wrapHtml(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 32px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .header { background-color: #0f172a; padding: 24px 32px; }
    .brand { color: #ffffff; font-size: 18px; font-weight: 700; text-decoration: none; }
    .brand span { color: #2563eb; }
    .content { padding: 32px; font-size: 14px; line-height: 1.6; color: #334155; }
    .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
    .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5; }
    .link { color: #2563eb; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">ClearPath <span>/</span> Student Debt Engine</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      This is an automated security notification from ClearPath.<br>
      ClearPath is an independent student debt calculation tool. We never sell loans or share your information.
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const from = process.env.EMAIL_FROM || 'noreply@clearpath.local';
  const url = actionUrl('/verify-email', token);

  const text = `Welcome to ClearPath.\n\nPlease verify your email address by opening the following link within 24 hours:\n${url}\n\nIf you did not create a ClearPath account, you can safely ignore this email.`;

  const html = wrapHtml('Verify your ClearPath email', `
    <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Verify your email address</h2>
    <p>Thank you for creating an account with ClearPath. Please confirm your email address to activate your account and start managing your student loan portfolio.</p>
    <p style="text-align: center;">
      <a href="${url}" class="btn">Verify Email Address</a>
    </p>
    <p style="font-size: 13px; color: #64748b;">Or copy and paste this URL into your browser:</p>
    <p><a href="${url}" class="link">${url}</a></p>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This verification link will expire in 24 hours. If you did not create an account, no further action is required.</p>
  `);

  const transport = createTransport();
  await transport.sendMail({
    from,
    to: email,
    subject: 'Verify your email for ClearPath',
    text,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const from = process.env.EMAIL_FROM || 'noreply@clearpath.local';
  const url = actionUrl('/reset-password', token);

  const text = `Reset your ClearPath password.\n\nUse this one-time link to set a new password:\n${url}\n\nThis link will expire in 60 minutes.\nIf you did not request a password reset, you can safely ignore this email.`;

  const html = wrapHtml('Reset your ClearPath password', `
    <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Password Reset Request</h2>
    <p>We received a request to reset the password for your ClearPath account (${email}).</p>
    <p style="text-align: center;">
      <a href="${url}" class="btn">Reset My Password</a>
    </p>
    <p style="font-size: 13px; color: #64748b;">Or copy and paste this URL into your browser:</p>
    <p><a href="${url}" class="link">${url}</a></p>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This link will expire in 60 minutes. If you did not request this change, your account remains secure and you may safely ignore this message.</p>
  `);

  const transport = createTransport();
  await transport.sendMail({
    from,
    to: email,
    subject: 'Reset your ClearPath password',
    text,
    html,
  });
}

export async function sendSecurityNotification(email: string, message: string): Promise<void> {
  const from = process.env.EMAIL_FROM || 'noreply@clearpath.local';
  const text = `ClearPath Security Notification:\n\n${message}\n\nIf you did not authorize this change, please sign in immediately and update your credentials.`;

  const html = wrapHtml('ClearPath Security Notice', `
    <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Security Notification</h2>
    <p>${message}</p>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">If you did not initiate this change, please sign in and reset your password immediately to secure your account.</p>
  `);

  const transport = createTransport();
  await transport.sendMail({
    from,
    to: email,
    subject: 'ClearPath Account Security Alert',
    text,
    html,
  });
}
