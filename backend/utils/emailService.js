const nodemailer = require('nodemailer');

function envClean(key) {
  const raw = process.env[key];
  if (raw == null) return '';
  return String(raw).trim().replace(/^["']|["']$/g, '');
}

function getSmtpTransport() {
  const SMTP_USER = envClean('SMTP_USER');
  const SMTP_PASS = envClean('SMTP_PASS');
  const SMTP_SERVICE = envClean('SMTP_SERVICE');
  const SMTP_HOST = envClean('SMTP_HOST');
  const SMTP_PORT = envClean('SMTP_PORT');

  if (!SMTP_PASS || !SMTP_USER) {
    return null;
  }

  if (SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: SMTP_SERVICE,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  }

  const host = SMTP_HOST || 'smtp.gmail.com';
  const port = SMTP_PORT ? Number(SMTP_PORT) : 587;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

function getFrom() {
  const from = envClean('SMTP_FROM');
  if (from) return from;
  return envClean('SMTP_USER');
}

/** True when outgoing mail can be sent (OTP, seller emails). */
function isSmtpConfigured() {
  return !!(envClean('SMTP_USER') && envClean('SMTP_PASS'));
}

exports.isSmtpConfigured = isSmtpConfigured;

function sellerApprovedTemplate({ name, userId, loginEmail, temporaryPassword }) {
  const safeName = name || 'Seller';
  const loginLine = loginEmail
    ? `Login Email: ${loginEmail}\n`
    : '';
  const tempPasswordLine = temporaryPassword
    ? `Temporary Password: ${temporaryPassword}\nPlease change your password after your first login.\n`
    : '';
  return {
    subject: 'Your seller account has been approved',
    text: `Hello ${safeName},\n\nYour account has been approved. Your seller id on the platform is: ${userId || ''}.\n${loginLine}${tempPasswordLine}\nYou can now log in and start selling.\n`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Hello ${safeName},</h2>
        <p style="margin: 0 0 12px;">Your id has been registred on the platform and your seller account is approved.</p>
        ${loginEmail ? `<p style="margin: 0 0 8px;"><strong>Login Email:</strong> ${loginEmail}</p>` : ''}
        ${
          temporaryPassword
            ? `<p style="margin: 0 0 12px;"><strong>Temporary Password:</strong> ${temporaryPassword}<br/>Please change your password after your first login.</p>`
            : ''
        }
        <p style="margin: 0 0 18px;">You can now log in and start selling.</p>
        <div style="padding: 12px 14px; background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 10px;">
          <p style="margin: 0; font-weight: bold;">Your Seller ID: ${userId || ''}</p>
        </div>
      </div>
    `
  };
}

function sellerRejectedTemplate({ name, reviewNote, hasPlatformAccount }) {
  const safeName = name || 'Seller';
  const reason = reviewNote || '(not provided)';
  const nextSteps =
    hasPlatformAccount === true
      ? 'You can sign in with this email and password to open Seller KYC and re-submit documents, or use the seller registration page with the same email to start a fresh application.'
      : 'You do not have a login yet. Open the seller registration page on our website and submit a new application using this same email address.';

  return {
    subject: 'Seller application rejected — you may apply again',
    text: `Hello ${safeName},\n\nYour seller application was reviewed and not approved at this time.\n\nReason: ${reason}\n\n${nextSteps}\n`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Hello ${safeName},</h2>
        <p style="margin: 0 0 12px;">Your seller application was reviewed and not approved at this time.</p>
        <p style="margin: 0 0 12px;"><strong>Reason:</strong> ${reason}</p>
        <p style="margin: 0 0 12px;">${nextSteps}</p>
      </div>
    `
  };
}

/**
 * Sends mail, or skips quietly when SMTP is not configured (local dev).
 * @returns {{ sent: boolean, skipped?: boolean }}
 */
async function sendMail({ to, subject, text, html }) {
  const transport = getSmtpTransport();
  if (!transport) {
    return { sent: false, skipped: true };
  }

  const from = getFrom();

  await transport.sendMail({
    from: from || undefined,
    to,
    subject,
    text,
    html
  });
  return { sent: true };
}

exports.sendSellerApprovalEmail = async ({ to, name, userId, loginEmail, temporaryPassword }) => {
  const template = sellerApprovedTemplate({ name, userId, loginEmail, temporaryPassword });
  return sendMail({ to, ...template });
};

exports.sendSellerRejectionEmail = async ({ to, name, reviewNote, hasPlatformAccount }) => {
  const template = sellerRejectedTemplate({ name, reviewNote, hasPlatformAccount });
  return sendMail({ to, ...template });
};

exports.sendPasswordResetOtpEmail = async ({ to, name, otp }) => {
  const safeName = name || 'User';
  const safeOtp = String(otp || '').trim();
  const subject = 'Password reset OTP (valid for 3 minutes)';
  const text = `Hello ${safeName},\n\nUse this OTP to reset your password: ${safeOtp}\n\nThis OTP is valid for 3 minutes.\nIf you did not request this, please ignore this email.\n`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Hello ${safeName},</h2>
      <p style="margin: 0 0 12px;">You requested to reset your password.</p>
      <p style="margin: 0 0 12px;">Use the OTP below to continue:</p>
      <div style="display: inline-block; margin: 0 0 14px; padding: 12px 18px; background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 10px; font-size: 24px; font-weight: bold; letter-spacing: 4px;">
        ${safeOtp}
      </div>
      <p style="margin: 0 0 8px;"><strong>This OTP will expire in 3 minutes.</strong></p>
      <p style="margin: 0;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  return sendMail({ to, subject, text, html });
};

