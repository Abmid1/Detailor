const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { sendOtp, verifyOtp } = require('../services/otp.service');
const { authenticate } = require('../middleware/auth');

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`;
  if (digits.startsWith('233')) return `+${digits}`;
  return `+${digits}`;
}

function issueToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

// POST /auth/otp/send
router.post('/otp/send', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const normalized = normalizePhone(phone);
    const result = await sendOtp(normalized);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /auth/otp/verify
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { phone, code, role = 'customer' } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

    const normalized = normalizePhone(phone);
    const valid = await verifyOtp(normalized, code);
    if (!valid) return res.status(401).json({ error: 'Invalid or expired code' });

    // Upsert user
    const { rows } = await query(
      `INSERT INTO users (phone, role)
       VALUES ($1, $2)
       ON CONFLICT (phone) DO UPDATE SET is_active = TRUE
       RETURNING id, phone, name, role`,
      [normalized, role]
    );

    const user = rows[0];
    const token = issueToken(user.id);
    res.json({ token, user });
  } catch (err) { next(err); }
});

// GET /auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /auth/me
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, push_token } = req.body;
    const { rows } = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         push_token = COALESCE($2, push_token)
       WHERE id = $3
       RETURNING id, phone, name, role, push_token`,
      [name, push_token, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
