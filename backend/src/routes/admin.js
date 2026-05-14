const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

// GET /admin/dashboard — top-level ops snapshot
router.get('/dashboard', async (req, res, next) => {
  try {
    const [jobStats, revenueRow, techStats] = await Promise.all([
      query(`
        SELECT status, COUNT(*) AS count
        FROM jobs
        WHERE scheduled_at::date = CURRENT_DATE
        GROUP BY status
      `),
      query(`
        SELECT COALESCE(SUM(total_amount_ghs), 0) AS today_revenue
        FROM jobs
        WHERE scheduled_at::date = CURRENT_DATE AND payment_status = 'paid'
      `),
      query(`
        SELECT u.id, u.name, tp.is_available, tp.current_lat, tp.current_lng,
          COUNT(j.id) AS jobs_today
        FROM technician_profiles tp
        JOIN users u ON u.id = tp.user_id
        LEFT JOIN jobs j ON j.technician_id = tp.user_id AND j.scheduled_at::date = CURRENT_DATE
        GROUP BY u.id, u.name, tp.is_available, tp.current_lat, tp.current_lng
      `),
    ]);

    res.json({
      today_jobs: jobStats.rows,
      today_revenue: revenueRow.rows[0].today_revenue,
      technicians: techStats.rows,
    });
  } catch (err) { next(err); }
});

// GET /admin/jobs — all jobs with filters
router.get('/jobs', async (req, res, next) => {
  try {
    const { date, status, tech_id } = req.query;
    const conditions = ['1=1'];
    const params = [];

    if (date) { params.push(date); conditions.push(`j.scheduled_at::date = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`j.status = $${params.length}`); }
    if (tech_id) { params.push(tech_id); conditions.push(`j.technician_id = $${params.length}`); }

    const { rows } = await query(`
      SELECT j.*,
        cu.name AS customer_name, cu.phone AS customer_phone,
        tu.name AS tech_name,
        v.make, v.model, v.plate,
        sb.name AS bundle_name
      FROM jobs j
      JOIN users cu ON cu.id = j.customer_id
      LEFT JOIN users tu ON tu.id = j.technician_id
      JOIN vehicles v ON v.id = j.vehicle_id
      JOIN service_bundles sb ON sb.id = j.bundle_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY j.scheduled_at DESC
      LIMIT 200
    `, params);
    res.json({ jobs: rows });
  } catch (err) { next(err); }
});

// GET /admin/customers
router.get('/customers', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT u.*,
        COUNT(j.id) AS total_jobs,
        COUNT(v.id) AS total_vehicles,
        MAX(j.scheduled_at) AS last_booking
      FROM users u
      LEFT JOIN jobs j ON j.customer_id = u.id
      LEFT JOIN vehicles v ON v.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ customers: rows });
  } catch (err) { next(err); }
});

// POST /admin/technicians — add a technician account
router.post('/technicians', async (req, res, next) => {
  try {
    const { phone, name, van_id } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    const { rows: [user] } = await query(
      `INSERT INTO users (phone, name, role) VALUES ($1,$2,'technician')
       ON CONFLICT (phone) DO UPDATE SET role = 'technician', name = COALESCE($2, name)
       RETURNING *`,
      [phone, name]
    );
    await query(
      `INSERT INTO technician_profiles (user_id, van_id) VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET van_id = $2`,
      [user.id, van_id || null]
    );
    res.status(201).json({ technician: user });
  } catch (err) { next(err); }
});

// PATCH /admin/jobs/:id/assign — manually reassign technician
router.patch('/jobs/:id/assign', async (req, res, next) => {
  try {
    const { technician_id } = req.body;
    await query(
      `UPDATE jobs SET technician_id = $1, status = 'confirmed' WHERE id = $2`,
      [technician_id, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
