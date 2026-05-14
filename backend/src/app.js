require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRouter     = require('./routes/auth');
const vehiclesRouter = require('./routes/vehicles');
const bundlesRouter  = require('./routes/bundles');
const bookingsRouter = require('./routes/bookings');
const jobsRouter     = require('./routes/jobs');
const paymentsRouter = require('./routes/payments');
const ratingsRouter  = require('./routes/ratings');
const adminRouter    = require('./routes/admin');
const errorHandler   = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Strict rate limit on auth endpoints
app.use('/auth/otp', rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: { error: 'Too many OTP requests' } }));

// General rate limit
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }));

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use('/auth',     authRouter);
app.use('/vehicles', vehiclesRouter);
app.use('/bundles',  bundlesRouter);
app.use('/bookings', bookingsRouter);
app.use('/jobs',     jobsRouter);
app.use('/payments', paymentsRouter);
app.use('/ratings',  ratingsRouter);
app.use('/admin',    adminRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Detailor API running on :${PORT}`));

module.exports = app;
