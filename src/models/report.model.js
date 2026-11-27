
const pool = require('../config/database');

// Appointment counts grouped by status
async function getAppointmentSummary() {
  const [rows] = await pool.execute(
    `SELECT
       status,
       COUNT(*) AS total
     FROM appointments
     GROUP BY status`
  );

  return rows;
}

// Appointment statistics grouped by doctor
async function getDoctorStatistics() {
  const [rows] = await pool.execute(
    `SELECT
       d.id AS doctor_id,
       d.first_name,
       d.last_name,
       d.specialty,
       COUNT(a.id) AS total_appointments,
       SUM(CASE WHEN a.status = 'booked' THEN 1 ELSE 0 END)
         AS active_appointments,
       SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END)
         AS cancelled_appointments
     FROM doctors d
     LEFT JOIN appointments a ON d.id = a.doctor_id
     GROUP BY d.id, d.first_name, d.last_name, d.specialty
     ORDER BY total_appointments DESC`
  );

  return rows;
}

// Revenue and refunds
async function getRevenueStatistics() {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS total_appointments,
       SUM(amount_paid) AS total_amount_paid,
       SUM(refund_amount) AS total_refunded,
       SUM(amount_paid - refund_amount) AS net_revenue
     FROM appointments`
  );

  return rows[0];
}

module.exports = {
  getAppointmentSummary,
  getDoctorStatistics,
  getRevenueStatistics
};
