const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { assignTechnician } = require('../services/dispatch.service');
const { notifyJobConfirmed, notifyTechNewJob } = require('../services/notification.service');
const { requestPayment } = require('../services/payment.service');

router.use(authenticate);

// GET /bookings — customer sees their jobs
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT j.*,
        v.make, v.model, v.color, v.plate,
        sb.name AS bundle_name, sb.price_ghs, sb.duration_minutes,
        u.name AS technician_name, u.phone AS technician_phone
      FROM jobs j
      JOIN vehicles v ON v.id = j.vehicle_id
      JOIN service_bundles sb ON sb.id = j.bundle_id
      LEFT JOIN users u ON u.id = j.technician_id
      WHERE j.customer_id = $1
      ORDER BY j.scheduled_at DESC
    `, [req.user.id]);
    res.json({ bookings: rows });
  } catch (err) { next(err); }
});

// GET /bookings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT j.*,
        v.make, v.model, v.color, v.plate,
        sb.name AS bundle_name, sb.price_ghs, sb.duration_minutes, sb.includes,
        u.name AS technician_name, u.phone AS technician_phone,
        tp.current_lat AS tech_lat, tp.current_lng AS tech_lng
      FROM jobs j
      JOIN vehicles v ON v.id = j.vehicle_id
      JOIN service_bundles sb ON sb.id = j.bundle_id
      LEFT JOIN users u ON u.id = j.technician_id
      LEFT JOIN technician_profiles tp ON tp.user_id = j.technician_id
      WHERE j.id = $1 AND j.customer_id = $2
    `, [req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking: rows[0] });
  } catch (err) { next(err); }
});

// POST /bookings — create a new booking
router.post('/', async (req, res, next) => {
  try {
    const {
      vehicle_id, bundle_id, scheduled_at,
      location_lat, location_lng, location_address,
      customer_notes, is_subscription,
    } = req.body;

    if (!vehicle_id || !bundle_id || !scheduled_at || !location_lat || !location_lng) {
      return res.status(400).json({ error: 'vehicle_id, bundle_id, scheduled_at, location required' });
    }

    // Verify vehicle belongs to customer
    const { rows: [vehicle] } = await query(
      `SELECT id FROM vehicles WHERE id = $1 AND user_id = $2`, [vehicle_id, req.user.id]
    );
    if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });

    const { rows: [bundle] } = await query(`SELECT * FROM service_bundles WHERE id = $1`, [bundle_id]);
    if (!bundle) return res.status(400).json({ error: 'Bundle not found' });

    const { rows: [job] } = await query(`
      INSERT INTO jobs
        (customer_id, vehicle_id, bundle_id, scheduled_at,
         location_lat, location_lng, location_address,
         total_amount_ghs, customer_notes, is_subscription)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      req.user.id, vehicle_id, bundle_id, scheduled_at,
      location_lat, location_lng, location_address,
      bundle.price_ghs, customer_notes, is_subscription ?? false,
    ]);

    // Auto-assign tech (best effort — don't fail booking if no techs / SQL issue)
    let tech = null;
    try {
      tech = await assignTechnician(job.id);
    } catch (err) {
      console.error('[Booking] assignTechnician failed:', err.message);
    }

    // Trigger MoMo payment request
    const momoRef = await requestPayment({
      jobId: job.id,
      amountGhs: bundle.price_ghs,
      phone: req.user.phone,
      description: `Detailor ${bundle.name}`,
    }).catch(() => null);

    // Notify customer (best effort)
    try {
      await notifyJobConfirmed(req.user, {
        ...job,
        scheduled_at_formatted: new Date(job.scheduled_at).toLocaleString('en-GH'),
      });
    } catch (err) {
      console.error('[Booking] notifyJobConfirmed failed:', err.message);
    }

    // Notify assigned tech (best effort)
    if (tech) {
      try {
        await notifyTechNewJob(tech, { ...job, location_address });
      } catch (err) {
        console.error('[Booking] notifyTechNewJob failed:', err.message);
      }
    }

    res.status(201).json({ booking: job, momo_reference: momoRef });
  } catch (err) { next(err); }
});

// DELETE /bookings/:id — cancel
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE jobs SET status = 'cancelled'
       WHERE id = $1 AND customer_id = $2 AND status IN ('pending','confirmed')
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Cannot cancel this booking' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
