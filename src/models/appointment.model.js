
const pool = require('../config/database');

// Retrieve all appointments
async function findAll() {
  const [rows] = await pool.execute(
    `SELECT
       a.id, a.reference, a.appointment_datetime,
       a.consultation_fee, a.amount_paid, a.status,
       a.refund_amount, a.booked_at, a.cancelled_at,
       p.first_name AS patient_first_name,
       p.last_name AS patient_last_name,
       d.first_name AS doctor_first_name,
       d.last_name AS doctor_last_name,
       d.specialty
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN doctors d ON a.doctor_id = d.id
     ORDER BY a.appointment_datetime DESC`
  );

  return rows;
}

// Retrieve one appointment
async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM appointments
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

// Create an appointment
async function create(data) {
  const {
    reference,
    patient_id,
    doctor_id,
    appointment_datetime,
    consultation_fee,
    amount_paid
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO appointments
     (reference, patient_id, doctor_id, appointment_datetime,
      consultation_fee, amount_paid)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      reference,
      patient_id,
      doctor_id,
      appointment_datetime,
      consultation_fee,
      amount_paid
    ]
  );

  return findById(result.insertId);
}

// Cancel an appointment
async function cancel(id, refundAmount) {
  const [result] = await pool.execute(
    `UPDATE appointments
     SET status = 'cancelled',
         refund_amount = ?,
         cancelled_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status = 'booked'`,
    [refundAmount, id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  cancel
};
