
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
  const connection = await pool.getConnection();
  let appointmentId;

  try {
    await connection.beginTransaction();

    // Lock the doctor row to serialize bookings for this doctor
    const [doctors] = await connection.execute(
      'SELECT id FROM doctors WHERE id = ? FOR UPDATE',
      [data.doctor_id]
    );

    if (doctors.length === 0) {
      const error = new Error('Doctor not found');
      error.code = 'ER_NO_REFERENCED_ROW_2';
      throw error;
    }

    // Determine the appointment day
    const appointmentDay = new Date(
      data.appointment_datetime
    ).toISOString().slice(0, 10);

    // Count non-cancelled appointments for this doctor on that day
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM appointments
       WHERE doctor_id = ?
         AND DATE(appointment_datetime) = ?
         AND status <> 'cancelled'`,
      [data.doctor_id, appointmentDay]
    );

    if (Number(rows[0].total) >= 12) {
      const error = new Error(
        'Doctor has reached the daily appointment limit'
      );
      error.code = 'APPOINTMENT_DAILY_LIMIT';
      throw error;
    }

    // Insert the appointment
    const [result] = await connection.execute(
      `INSERT INTO appointments
       (reference, patient_id, doctor_id, appointment_datetime,
        consultation_fee, amount_paid)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.reference,
        data.patient_id,
        data.doctor_id,
        data.appointment_datetime,
        data.consultation_fee,
        data.amount_paid
      ]
    );

    appointmentId = result.insertId;

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }

  return findById(appointmentId);
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
