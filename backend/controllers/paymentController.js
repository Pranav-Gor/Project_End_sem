const crypto = require('crypto');
const Razorpay = require('razorpay');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const WalletTopup = require('../models/WalletTopup');

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !String(keyId).trim() || !String(keySecret).trim()) {
    return null;
  }
  return new Razorpay({ key_id: keyId.trim(), key_secret: keySecret.trim() });
}

/**
 * Credit wallet once per Razorpay payment id (webhook + verify may race).
 */
async function creditWalletFromRazorpayPayment({
  userId,
  razorpayPaymentId,
  razorpayOrderId,
  amountPaise
}) {
  const amountInr = Math.round(Number(amountPaise) / 100);
  if (!Number.isFinite(amountInr) || amountInr < 1) {
    throw new Error('Invalid payment amount');
  }

  try {
    await WalletTopup.create({
      userId,
      razorpayPaymentId,
      paymentIntentId: razorpayPaymentId,
      razorpayOrderId: razorpayOrderId || undefined,
      amountPaise: Math.round(Number(amountPaise)),
      amountInr,
      currency: 'INR',
      status: 'captured'
    });
  } catch (e) {
    if (e.code === 11000) {
      const u = await User.findById(userId);
      return {
        alreadyProcessed: true,
        walletBalance: u?.walletBalance ?? 0,
        creditedInr: 0
      };
    }
    throw e;
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: amountInr } },
    { new: true }
  );

  return {
    alreadyProcessed: false,
    walletBalance: updated?.walletBalance ?? 0,
    creditedInr: amountInr
  };
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return expected === signature;
  }
}

/**
 * POST /api/payments/create-razorpay-order
 * Body: { amountInr } — whole rupees; creates Razorpay order with notes.userId.
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed'
      });
    }

    const rz = getRazorpay();
    if (!rz) {
      return res.status(503).json({
        success: false,
        code: 'RAZORPAY_NOT_CONFIGURED',
        message: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.'
      });
    }

    const amountInr = Number(req.body.amountInr);
    if (!Number.isFinite(amountInr) || amountInr < 1 || amountInr > 1_000_000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Use amountInr between 1 and 1,000,000 (INR).'
      });
    }

    const amountPaise = Math.round(amountInr * 100);
    if (amountPaise < 100) {
      return res.status(400).json({ success: false, message: 'Minimum top-up is ₹1 INR.' });
    }

    const uid = String(req.user.userId);
    const receipt = `w${uid.slice(-10)}${Date.now().toString(36)}`.slice(0, 40);

    const order = await rz.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId: uid
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID.trim()
      }
    });
  } catch (e) {
    console.error('createRazorpayOrder', e);
    return res.status(502).json({
      success: false,
      message: e?.message || 'Could not create Razorpay order.'
    });
  }
};

/**
 * POST /api/payments/verify-razorpay-wallet
 * Body: razorpay_order_id, razorpay_payment_id, razorpay_signature — after Checkout success; credits wallet (idempotent).
 */
exports.verifyRazorpayWallet = async (req, res) => {
  try {
    const rz = getRazorpay();
    if (!rz) {
      return res.status(503).json({
        success: false,
        code: 'RAZORPAY_NOT_CONFIGURED',
        message: 'Razorpay is not configured.'
      });
    }

    const orderId = String(req.body._orderId || '').trim();
    const paymentId = String(req.body._paymentId || '').trim();
    const signature = String(req.body._signature || '').trim();

    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    const payment = await rz.payments.fetch(paymentId);
    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: `Payment not complete (status: ${payment.status}). Wait a moment and refresh your balance, or contact support.`
      });
    }

    if (String(payment.order_id) !== orderId) {
      return res.status(400).json({ success: false, message: 'Order and payment do not match.' });
    }

    const order = await rz.orders.fetch(orderId);
    const noteUserId = order.notes && order.notes.userId ? String(order.notes.userId) : '';
    if (!noteUserId || noteUserId !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'This order does not belong to your account.'
      });
    }

    const orderAmount = Number(order.amount);
    const payAmount = Number(payment.amount);
    if (payAmount !== orderAmount) {
      return res.status(400).json({ success: false, message: 'Payment amount mismatch.' });
    }

    const result = await creditWalletFromRazorpayPayment({
      userId: req.user.userId,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      amountPaise: payAmount
    });

    return res.status(200).json({
      success: true,
      data: {
        alreadyProcessed: result.alreadyProcessed,
        walletBalance: result.walletBalance,
        creditedInr: result.creditedInr
      }
    });
  } catch (e) {
    console.error('verifyRazorpayWallet', e);
    return res.status(502).json({
      success: false,
      message: e?.message || 'Could not verify payment.'
    });
  }
};

/**
 * POST /api/payments/razorpay-webhook — raw JSON body; X-Razorpay-Signature
 */
exports.razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !String(webhookSecret).trim()) {
    console.warn('razorpayWebhook: RAZORPAY_WEBHOOK_SECRET missing; refusing webhook');
    return res.status(503).json({ success: false, message: 'Webhook not configured' });
  }

  const sig = req.headers['x-razorpay-signature'];
  if (!sig) {
    return res.status(400).json({ success: false, message: 'Missing signature' });
  }

  const raw = req.body;
  const bodyString = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
  const expected = crypto
    .createHmac('sha256', webhookSecret.trim())
    .update(bodyString)
    .digest('hex');

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8'));
  } catch {
    valid = expected === sig;
  }
  if (!valid) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  let payload;
  try {
    payload = JSON.parse(bodyString);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid JSON' });
  }

  const event = payload.event;
  if (event !== 'payment.captured') {
    return res.status(200).json({ received: true, ignored: event });
  }

  const entity = payload.payload?.payment?.entity;
  if (!entity || !entity.id) {
    return res.status(200).json({ received: true, ignored: 'no payment entity' });
  }

  const paymentId = entity.id;
  const orderId = entity.order_id;
  const amountPaise = entity.amount;
  let userId =
    entity.notes && entity.notes.userId
      ? String(entity.notes.userId)
      : null;

  const rz = getRazorpay();
  if (!userId && orderId && rz) {
    try {
      const order = await rz.orders.fetch(orderId);
      if (order.notes && order.notes.userId) userId = String(order.notes.userId);
    } catch (e) {
      console.error('razorpayWebhook fetch order', e);
    }
  }

  if (!userId) {
    console.warn('razorpayWebhook: no userId in notes for payment', paymentId);
    return res.status(200).json({ received: true, ignored: 'no userId' });
  }

  try {
    await creditWalletFromRazorpayPayment({
      userId,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId || undefined,
      amountPaise
    });
  } catch (e) {
    console.error('razorpayWebhook credit', e);
    return res.status(500).json({ success: false });
  }

  return res.status(200).json({ received: true, credited: true });
};
