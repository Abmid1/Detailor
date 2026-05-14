const router = require('express').Router();
const { query } = require('../config/database');

// GET /bundles — public, no auth needed
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM service_bundles WHERE is_active = TRUE ORDER BY sort_order`
    );
    res.json({ bundles: rows });
  } catch (err) { next(err); }
});

module.exports = router;
