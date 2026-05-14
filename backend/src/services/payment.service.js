const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

const MOMO_BASE = process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const TARGET_ENV = process.env.MOMO_TARGET_ENV || 'sandbox';

async function getMomoToken() {
  const credentials = Buffer.from(
    `${process.env.MOMO_API_USER}:${process.env.MOMO_API_KEY}`
  ).toString('base64');

  const { data } = await axios.post(
    `${MOMO_BASE}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY,
      },
    }
  );
  return data.access_token;
}

async function requestPayment({ jobId, amountGhs, phone, description }) {
  const reference = uuidv4();
  const token = await getMomoToken();

  await axios.post(
    `${MOMO_BASE}/collection/v1_0/requesttopay`,
    {
      amount: String(amountGhs),
      currency: 'GHS',
      externalId: jobId,
      payer: { partyIdType: 'MSISDN', partyId: phone.replace('+', '') },
      payerMessage: description,
      payeeNote: `Detailor job ${jobId}`,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': reference,
        'X-Target-Environment': TARGET_ENV,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  // Record in DB
  await query(
    `INSERT INTO payments (job_id, amount_ghs, momo_reference, status)
     VALUES ($1, $2, $3, 'pending')`,
    [jobId, amountGhs, reference]
  );

  return reference;
}

async function checkPaymentStatus(reference) {
  const token = await getMomoToken();

  const { data } = await axios.get(
    `${MOMO_BASE}/collection/v1_0/requesttopay/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': TARGET_ENV,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY,
      },
    }
  );

  const status = data.status === 'SUCCESSFUL' ? 'successful'
               : data.status === 'FAILED'     ? 'failed'
               : 'pending';

  await query(
    `UPDATE payments SET status = $1, metadata = $2 WHERE momo_reference = $3`,
    [status, JSON.stringify(data), reference]
  );

  if (status === 'successful') {
    await query(
      `UPDATE jobs SET payment_status = 'paid', payment_ref = $1 WHERE id = (
         SELECT job_id FROM payments WHERE momo_reference = $1
       )`,
      [reference]
    );
  }

  return status;
}

module.exports = { requestPayment, checkPaymentStatus };
