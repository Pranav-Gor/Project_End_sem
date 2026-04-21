const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { sendNewsletterWelcomeEmail, sendNewsletterBroadcast } = require('../utils/emailService');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const emailNorm = String(email).trim().toLowerCase();
    
    // Check if already subscribed
    let subscriber = await NewsletterSubscriber.findOne({ email: emailNorm });
    if (subscriber) {
      return res.status(400).json({ success: false, message: 'You are already subscribed!' });
    }

    subscriber = await NewsletterSubscriber.create({ email: emailNorm });

    // Send welcome email
    try {
      await sendNewsletterWelcomeEmail({ to: emailNorm });
    } catch (err) {
      console.error('Failed to send newsletter welcome email:', err);
      // We don't fail the request if the email sending fails, but we log it.
    }

    res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.broadcast = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const subscribers = await NewsletterSubscriber.find({}).select('email').lean();
    if (subscribers.length === 0) {
      return res.status(400).json({ success: false, message: 'No subscribers found' });
    }

    let successCount = 0;
    // For large scale, use a queue. For now, Promise.all or sequential.
    for (const sub of subscribers) {
      try {
        await sendNewsletterBroadcast({ to: sub.email, subject, message });
        successCount++;
      } catch (err) {
        console.error(`Failed to send broadcast to ${sub.email}:`, err);
      }
    }

    res.json({ success: true, message: `Broadcast sent to ${successCount} subscribers.` });
  } catch (error) {
    console.error('Newsletter broadcast error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
