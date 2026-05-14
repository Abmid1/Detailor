const axios = require('axios');

// ─── Expo Push ────────────────────────────────────────────────────────────────
async function sendPush(pushToken, { title, body, data = {} }) {
  if (!pushToken) return;
  try {
    await axios.post(
      'https://exp.host/--/api/v2/push/send',
      { to: pushToken, title, body, data, sound: 'default' },
      {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('[Push] Failed:', err.message);
  }
}

// ─── WhatsApp (360dialog) ─────────────────────────────────────────────────────
async function sendWhatsApp(to, text) {
  if (!process.env.WHATSAPP_API_KEY) return;
  try {
    await axios.post(
      `${process.env.WHATSAPP_API_URL}/messages`,
      {
        recipient_type: 'individual',
        to: to.replace('+', ''),
        type: 'text',
        text: { body: text },
      },
      { headers: { 'D360-API-KEY': process.env.WHATSAPP_API_KEY } }
    );
  } catch (err) {
    console.error('[WhatsApp] Failed:', err.message);
  }
}

// ─── High-level notification helpers ─────────────────────────────────────────
async function notifyJobConfirmed(user, job) {
  const msg = `Hi ${user.name || 'there'}! Your Detailor booking for ${job.scheduled_at_formatted} is confirmed. We'll send your tech's ETA when they're on the way.`;
  await Promise.all([
    sendPush(user.push_token, { title: 'Booking confirmed', body: msg }),
    sendWhatsApp(user.phone, msg),
  ]);
}

async function notifyTechEnRoute(customer, technician, etaMinutes) {
  const msg = `Your Detailor tech is ${etaMinutes} minutes away!`;
  await sendPush(customer.push_token, { title: 'Tech on the way', body: msg, data: { screen: 'tracking' } });
  await sendWhatsApp(customer.phone, msg);
}

async function notifyJobComplete(customer, job) {
  const msg = `Your car is sparkling clean! Please rate your experience in the app.`;
  await sendPush(customer.push_token, {
    title: 'Job complete!',
    body: msg,
    data: { screen: 'rating', jobId: job.id },
  });
  await sendWhatsApp(customer.phone, msg);
}

async function notifyTechNewJob(technician, job) {
  await sendPush(technician.push_token, {
    title: 'New job assigned',
    body: `You have a new job at ${job.location_address}`,
    data: { screen: 'job', jobId: job.id },
  });
}

module.exports = {
  sendPush,
  sendWhatsApp,
  notifyJobConfirmed,
  notifyTechEnRoute,
  notifyJobComplete,
  notifyTechNewJob,
};
