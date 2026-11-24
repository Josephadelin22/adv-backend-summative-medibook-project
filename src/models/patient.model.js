
const pool = require('../config/database');

// Retrieve all patients
async function findAll() {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, email, phone,
            created_at, updated_at
     FROM patients
     ORDER BY id DESC`
  );

  return rows;
}

// Retrieve one patient by ID
async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, email, phone,
            created_at, updated_at
     FROM patients
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

// Create a patient
async function create(patient) {
  const { first_name, last_name, email, phone } = patient;

  const [result] = await pool.execute(
    `INSERT INTO patients (first_name, last_name, email, phone)
     VALUES (?, ?, ?, ?)`,
    [first_name, last_name, email, phone]
  );

  return findById(result.insertId);
}

// Update a patient
async function update(id, patient) {
  const { first_name, last_name, email, phone } = patient;

  await pool.execute(
    `UPDATE patients
     SET first_name = ?, last_name = ?, email = ?, phone = ?
     WHERE id = ?`,
    [first_name, last_name, email, phone, id]
  );

  return findById(id);
}

// Delete a patient
async function remove(id) {
  const [result] = await pool.execute(
    'DELETE FROM patients WHERE id = ?',
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
