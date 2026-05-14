const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /vehicles — list my vehicles
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM vehicles WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC`,
      [req.user.id]
    );
    res.json({ vehicles: rows });
  } catch (err) { next(err); }
});

// POST /vehicles
router.post('/', async (req, res, next) => {
  try {
    const { make, model, year, color, plate, notes, is_default } = req.body;
    if (!make || !model) return res.status(400).json({ error: 'make and model required' });

    if (is_default) {
      await query(`UPDATE vehicles SET is_default = FALSE WHERE user_id = $1`, [req.user.id]);
    }

    const { rows } = await query(
      `INSERT INTO vehicles (user_id, make, model, year, color, plate, notes, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, make, model, year, color, plate, notes, is_default ?? false]
    );
    res.status(201).json({ vehicle: rows[0] });
  } catch (err) { next(err); }
});

// PATCH /vehicles/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { make, model, year, color, plate, notes, is_default } = req.body;

    if (is_default) {
      await query(`UPDATE vehicles SET is_default = FALSE WHERE user_id = $1`, [req.user.id]);
    }

    const { rows } = await query(
      `UPDATE vehicles SET
         make = COALESCE($1, make), model = COALESCE($2, model),
         year = COALESCE($3, year), color = COALESCE($4, color),
         plate = COALESCE($5, plate), notes = COALESCE($6, notes),
         is_default = COALESCE($7, is_default)
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [make, model, year, color, plate, notes, is_default, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /vehicles/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM vehicles WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
