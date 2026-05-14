const axios = require('axios');
const { query } = require('../config/database');

// Basic greedy nearest-available-tech assignment.
// Replace with Routific or Google OR-Tools for multi-stop optimization.
async function assignTechnician(jobId) {
  const { rows: [job] } = await query(`SELECT * FROM jobs WHERE id = $1`, [jobId]);

  // Find available technicians sorted by distance to job location
  const { rows: techs } = await query(`
    SELECT u.id, u.name, u.push_token, tp.current_lat, tp.current_lng,
      point(tp.current_lng, tp.current_lat) <@> point($1, $2) AS dist_miles
    FROM technician_profiles tp
    JOIN users u ON u.id = tp.user_id
    WHERE tp.is_available = TRUE AND u.is_active = TRUE
    ORDER BY dist_miles ASC
    LIMIT 1
  `, [job.location_lng, job.location_lat]);

  if (!techs[0]) return null;

  const tech = techs[0];
  await query(
    `UPDATE jobs SET technician_id = $1, status = 'confirmed' WHERE id = $2`,
    [tech.id, jobId]
  );

  return tech;
}

async function getTodayRoute(technicianId) {
  const { rows } = await query(`
    SELECT j.*,
      u.name AS customer_name,
      u.phone AS customer_phone,
      v.make, v.model, v.color, v.plate,
      sb.name AS bundle_name, sb.duration_minutes,
      sb.includes AS bundle_includes
    FROM jobs j
    JOIN users u ON u.id = j.customer_id
    JOIN vehicles v ON v.id = j.vehicle_id
    JOIN service_bundles sb ON sb.id = j.bundle_id
    WHERE j.technician_id = $1
      AND j.scheduled_at::date = CURRENT_DATE
      AND j.status NOT IN ('cancelled', 'completed')
    ORDER BY j.scheduled_at ASC
  `, [technicianId]);

  return rows;
}

async function getEta(techLat, techLng, destLat, destLng) {
  if (!process.env.GOOGLE_MAPS_API_KEY) return null;
  try {
    const { data } = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${techLat},${techLng}`,
        destinations: `${destLat},${destLng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        mode: 'driving',
      },
    });
    const element = data.rows?.[0]?.elements?.[0];
    if (element?.status === 'OK') {
      return Math.ceil(element.duration.value / 60); // minutes
    }
  } catch {}
  return null;
}

module.exports = { assignTechnician, getTodayRoute, getEta };
