const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// POST /ratings
router.post('/', async (req, res, next) => {
  try {
    const { job_id, stars, comment } = req.body;
    if (!job_id || !stars) return res.status(400).json({ error: 'job_id and stars required' });

    const { rows: [job] } = await query(
      `SELECT * FROM jobs WHERE id = $1 AND customer_id = $2 AND status = 'completed'`,
      [job_id, req.user.id]
    );
    if (!job) return res.status(400).json({ error: 'Job not found or not completed' });

    const { rows } = await query(
      `INSERT INTO ratings (job_id, customer_id, technician_id, stars, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (job_id) DO UPDATE SET stars = $4, comment = $5
       RETURNING *`,
      [job_id, req.user.id, job.technician_id, stars, comment]
    );
    res.status(201).json({ rating: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
