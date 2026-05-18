const axios = require('axios');
const { query } = require('../config/database');

const OTP_TTL_MINUTES = 5;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtp(phone) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate any existing unused codes for this phone
  await query(`UPDATE otp_codes SET used = TRUE WHERE phone = $1 AND used = FALSE`, [phone]);

  await query(
    `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)`,
    [phone, code, expiresAt]
  );

  // No SMS key set yet → fall back to logging the code (use for testing)
  if (!process.env.SMS_API_KEY) {
    console.log(`[OTP] ${phone} → ${code}`);
    return { sent: true, dev_code: code };
  }

  // Arkesel SMS gateway (popular in Ghana)
  try {
    await axios.get('https://sms.arkesel.com/sms/api', {
      params: {
        action: 'send-sms',
        api_key: process.env.SMS_API_KEY,
        to: phone,
        from: process.env.SMS_SENDER_ID || 'Detailor',
        sms: `Your Detailor code is ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`,
      },
    });
  } catch (err) {
    console.error('[SMS] Send failed, logging code instead:', err.message);
    console.log(`[OTP] ${phone} → ${code}`);
  }

  return { sent: true };
}

async function verifyOtp(phone, code) {
  const { rows } = await query(
    `SELECT id FROM otp_codes
     WHERE phone = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, code]
  );

  if (!rows[0]) return false;

  await query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [rows[0].id]);
  return true;
}

module.exports = { sendOtp, verifyOtp };
