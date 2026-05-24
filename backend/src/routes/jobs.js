// Technician-facing job actions
const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { getTodayRoute, getEta } = require('../services/dispatch.service');
const { notifyTechEnRoute, notifyJobComplete } = require('../services/notification.service');
const upload = require('../middleware/upload');
const { uploadPhoto } = require('../services/storage.service');

router.use(authenticate);

// GET /jobs/route — technician's optimized job list for today
router.get('/route', requireRole('technician'), async (req, res, next) => {
  try {
    const jobs = await getTodayRoute(req.user.id);
    res.json({ jobs });
  } catch (err) { next(err); }
});

// GET /jobs/available — unassigned jobs that technicians can accept
router.get('/available', requireRole('technician'), async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT j.*,
        u.name AS customer_name,
        v.make, v.model, v.color, v.plate,
        sb.name AS bundle_name, sb.duration_minutes, sb.includes
      FROM jobs j
      JOIN users u ON u.id = j.customer_id
      JOIN vehicles v ON v.id = j.vehicle_id
      JOIN service_bundles sb ON sb.id = j.bundle_id
      WHERE j.technician_id IS NULL
        AND j.status = 'pending'
        AND j.scheduled_at > NOW() - INTERVAL '1 hour'
      ORDER BY j.scheduled_at ASC
      LIMIT 50
    `);
    res.json({ jobs: rows });
  } catch (err) { next(err); }
});

// POST /jobs/:id/accept — technician claims an unassigned job
router.post('/:id/accept', requireRole('technician'), async (req, res, next) => {
  try {
    const { rows } = await query(`
      UPDATE jobs
      SET technician_id = $1, status = 'confirmed'
      WHERE id = $2 AND technician_id IS NULL AND status = 'pending'
      RETURNING *
    `, [req.user.id, req.params.id]);

    if (!rows[0]) {
      return res.status(409).json({ error: 'Job already taken or no longer available' });
    }
    res.json({ job: rows[0] });
  } catch (err) { next(err); }
});

// GET /jobs/:id — technician fetches single job detail
router.get('/:id', requireRole('technician', 'admin'), async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT j.*,
        u.name AS customer_name, u.phone AS customer_phone,
        v.make, v.model, v.color, v.plate, v.notes AS vehicle_notes,
        sb.name AS bundle_name, sb.includes, sb.duration_minutes
      FROM jobs j
      JOIN users u ON u.id = j.customer_id
      JOIN vehicles v ON v.id = j.vehicle_id
      JOIN service_bundles sb ON sb.id = j.bundle_id
      WHERE j.id = $1 AND j.technician_id = $2
    `, [req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Job not found' });

    const photos = await query(`SELECT * FROM photos WHERE job_id = $1 ORDER BY created_at`, [req.params.id]);
    res.json({ job: rows[0], photos: photos.rows });
  } catch (err) { next(err); }
});

// PATCH /jobs/:id/status — transition job state
const VALID_TRANSITIONS = {
  confirmed:    ['en_route'],
  en_route:     ['arrived'],
  arrived:      ['in_progress'],
  in_progress:  ['completed'],
};

router.patch('/:id/status', requireRole('technician'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const { rows: [job] } = await query(
      `SELECT * FROM jobs WHERE id = $1 AND technician_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const allowed = VALID_TRANSITIONS[job.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${job.status} → ${status}` });
    }

    const extras = {};
    if (status === 'in_progress') extras.started_at = new Date();
    if (status === 'completed') extras.completed_at = new Date();

    const { rows: [updated] } = await query(
      `UPDATE jobs SET status = $1,
         started_at = COALESCE($2, started_at),
         completed_at = COALESCE($3, completed_at)
       WHERE id = $4 RETURNING *`,
      [status, extras.started_at || null, extras.completed_at || null, job.id]
    );

    // Notify customer
    if (status === 'en_route') {
      const { rows: [customer] } = await query(`SELECT * FROM users WHERE id = $1`, [job.customer_id]);
      const eta = await getEta(req.body.tech_lat, req.body.tech_lng, job.location_lat, job.location_lng);
      await notifyTechEnRoute(customer, req.user, eta || '?');
    }

    if (status === 'completed') {
      const { rows: [customer] } = await query(`SELECT * FROM users WHERE id = $1`, [job.customer_id]);
      await notifyJobComplete(customer, job);
    }

    res.json({ job: updated });
  } catch (err) { next(err); }
});

// POST /jobs/:id/location — technician updates GPS position
router.post('/:id/location', requireRole('technician'), async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await query(
      `UPDATE technician_profiles SET current_lat = $1, current_lng = $2, last_seen_at = NOW()
       WHERE user_id = $3`,
      [lat, lng, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /jobs/:id/photos — upload pre/post photos
router.post('/:id/photos', requireRole('technician'), upload.array('photos', 10), async (req, res, next) => {
  try {
    const { type } = req.body; // pre_inspection | post_completion | damage_note
    if (!req.files?.length) return res.status(400).json({ error: 'No photos provided' });

    const { rows: [job] } = await query(
      `SELECT id FROM jobs WHERE id = $1 AND technician_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const saved = await Promise.all(
      req.files.map(async (file) => {
        const url = await uploadPhoto(file.buffer, file.mimetype);
        const { rows } = await query(
          `INSERT INTO photos (job_id, type, url) VALUES ($1,$2,$3) RETURNING *`,
          [job.id, type, url]
        );
        return rows[0];
      })
    );

    res.status(201).json({ photos: saved });
  } catch (err) { next(err); }
});

// POST /jobs/:id/notes — tech notes after job
router.post('/:id/notes', requireRole('technician'), async (req, res, next) => {
  try {
    const { tech_notes } = req.body;
    await query(`UPDATE jobs SET tech_notes = $1 WHERE id = $2 AND technician_id = $3`,
      [tech_notes, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
