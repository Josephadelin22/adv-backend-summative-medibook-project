
const pool = require('../config/database');

// Retrieve all doctors
async function findAll() {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, email,
            specialty, consultation_fee, room,
            created_at, updated_at
     FROM doctors
     ORDER BY id DESC`
  );

  return rows;
}

// Retrieve one doctor
async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, email,
            specialty, consultation_fee, room,
            created_at, updated_at
     FROM doctors
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

// Create a doctor
async function create(doctor) {
  const {
    first_name,
    last_name,
    email,
    specialty,
    consultation_fee,
    room
  } = doctor;

  const [result] = await pool.execute(
    `INSERT INTO doctors
     (first_name, last_name, email, specialty, consultation_fee, room)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, email, specialty, consultation_fee, room]
  );

  return findById(result.insertId);
}

// Update a doctor
async function update(id, doctor) {
  const {
    first_name,
    last_name,
    email,
    specialty,
    consultation_fee,
    room
  } = doctor;

  await pool.execute(
    `UPDATE doctors
     SET first_name = ?, last_name = ?, email = ?,
         specialty = ?, consultation_fee = ?, room = ?
     WHERE id = ?`,
    [
      first_name,
      last_name,
      email,
      specialty,
      consultation_fee,
      room,
      id
    ]
  );

  return findById(id);
}

// Delete a doctor
async function remove(id) {
  const [result] = await pool.execute(
    'DELETE FROM doctors WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
