const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkPaymentStatus } = require('../services/payment.service');

router.use(authenticate);

// GET /payments/:reference/status — poll MoMo payment status
router.get('/:reference/status', async (req, res, next) => {
  try {
    const status = await checkPaymentStatus(req.params.reference);
    res.json({ status });
  } catch (err) { next(err); }
});

module.exports = router;
