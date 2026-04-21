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

exports.sendRegistrationOtpEmail = async ({ to, name, otp }) => {
  const safeName = name || 'Welcome';
  const safeOtp = String(otp || '').trim();
  const subject = 'Auctus Registration OTP (valid for 3 minutes)';
  const text = `Hello ${safeName},\n\nWelcome to Auctus. Use this OTP to complete your registration: ${safeOtp}\n\nThis OTP is valid for 3 minutes.\nIf you did not request this, please ignore this email.\n`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Welcome to Auctus, ${safeName}!</h2>
      <p style="margin: 0 0 12px;">You are one step away from joining the most exclusive marketplace.</p>
      <p style="margin: 0 0 12px;">Use the OTP below to verify your email address:</p>
      <div style="display: inline-block; margin: 0 0 14px; padding: 12px 18px; background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 10px; font-size: 24px; font-weight: bold; letter-spacing: 4px;">
        ${safeOtp}
      </div>
      <p style="margin: 0 0 8px;"><strong>This OTP will expire in 3 minutes.</strong></p>
      <p style="margin: 0;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  return sendMail({ to, subject, text, html });
};

exports.sendAuctionStartedEmail = async ({ to, auctionTitle, auctionId }) => {
  const subject = `Live Now: ${auctionTitle}`;
  const url = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/auction/${auctionId}`;
  const text = `Hello,\n\nThe auction you are watching "${auctionTitle}" is now LIVE!\n\nBid now at: ${url}\n`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">The auction is live!</h2>
      <p style="margin: 0 0 12px;">The item you are watching, <strong>${auctionTitle}</strong>, is now accepting bids.</p>
      <p style="margin: 0 0 18px;">Don't miss out, place your bid now:</p>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Auction</a>
    </div>
  `;
  return sendMail({ to, subject, text, html });
};

exports.sendNewsletterWelcomeEmail = async ({ to }) => {
  const subject = 'Welcome to Auctus Newsletter!';
  const text = 'Welcome to Auctus!\n\nYou have successfully subscribed to our newsletter. You will receive exclusive updates on high-value drops and upcoming collections.\n\nThank you for joining us!\n';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px; color: #0f766e;">Welcome to Auctus!</h2>
      <p style="margin: 0 0 12px;">You have successfully subscribed to our newsletter.</p>
      <p style="margin: 0 0 12px;">Get ready to receive exclusive updates on high-value drops and upcoming collections right in your inbox.</p>
      <p style="margin: 0;">Thank you for joining us!</p>
    </div>
  `;
  return sendMail({ to, subject, text, html });
};

exports.sendNewsletterBroadcast = async ({ to, subject, message }) => {
  const text = `${message}\n\nYou are receiving this email because you subscribed to the Auctus newsletter.\n`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <div style="margin-bottom: 24px;">
        ${message.replace(/\n/g, '<br/>')}
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        You are receiving this email because you subscribed to the Auctus newsletter.
      </p>
    </div>
  `;
  return sendMail({ to, subject, text, html });
};

exports.sendAuctionWonEmailToWinner = async ({ to, winnerName, auctionTitle, finalBid, sellerName, sellerEmail, sellerPhone }) => {
  const subject = `Congratulations! You won the auction for ${auctionTitle}`;
  const text = `Hello ${winnerName},\n\nYou have won the auction for "${auctionTitle}" with a final bid of ₹${finalBid}.\n\nSeller Details:\nName: ${sellerName}\nEmail: ${sellerEmail}\nPhone: ${sellerPhone || 'Not provided'}\n\nThe seller will contact you shortly to arrange payment and shipping.\n`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px; color: #0f766e;">Congratulations, ${winnerName}!</h2>
      <p style="margin: 0 0 12px;">You are the winning bidder for <strong>${auctionTitle}</strong>.</p>
      <p style="margin: 0 0 12px;"><strong>Final Winning Bid:</strong> ₹${finalBid.toLocaleString('en-IN')}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <h3 style="margin: 0 0 12px;">Seller Contact Details</h3>
      <p style="margin: 0 0 4px;"><strong>Name:</strong> ${sellerName}</p>
      <p style="margin: 0 0 4px;"><strong>Email:</strong> ${sellerEmail}</p>
      <p style="margin: 0 0 12px;"><strong>Phone:</strong> ${sellerPhone || 'Not provided'}</p>
      <p style="margin: 0;">The seller will contact you shortly to arrange payment and shipping.</p>
    </div>
  `;
  return sendMail({ to, subject, text, html });
};

exports.sendAuctionSoldEmailToSeller = async ({ to, sellerName, auctionTitle, finalBid, winnerName, winnerEmail, winnerPhone, winnerAddress }) => {
  const subject = `Your auction for ${auctionTitle} has sold!`;
  const text = `Hello ${sellerName},\n\nYour auction for "${auctionTitle}" has successfully ended with a final bid of ₹${finalBid}.\n\nWinner Details:\nName: ${winnerName}\nEmail: ${winnerEmail}\nPhone: ${winnerPhone || 'Not provided'}\nAddress: ${winnerAddress || 'Not provided'}\n\nPlease contact the winner to arrange payment and shipping.\n`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px; color: #10b981;">Your Auction Sold!</h2>
      <p style="margin: 0 0 12px;">Hello ${sellerName}, your item <strong>${auctionTitle}</strong> has successfully ended.</p>
      <p style="margin: 0 0 12px;"><strong>Final Winning Bid:</strong> ₹${finalBid.toLocaleString('en-IN')}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <h3 style="margin: 0 0 12px;">Winner Contact Details</h3>
      <p style="margin: 0 0 4px;"><strong>Name:</strong> ${winnerName}</p>
      <p style="margin: 0 0 4px;"><strong>Email:</strong> ${winnerEmail}</p>
      <p style="margin: 0 0 4px;"><strong>Phone:</strong> ${winnerPhone || 'Not provided'}</p>
      <p style="margin: 0 0 12px;"><strong>Address:</strong> ${winnerAddress || 'Not provided'}</p>
      <p style="margin: 0;">Please contact the winner at your earliest convenience to arrange payment and shipping.</p>
    </div>
  `;
  return sendMail({ to, subject, text, html });
};
