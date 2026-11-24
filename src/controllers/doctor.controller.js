
const Doctor = require('../models/doctor.model');

const requiredFields = [
  'first_name',
  'last_name',
  'email',
  'specialty',
  'consultation_fee',
  'room'
];

function validateDoctor(body) {
  return requiredFields.every(
    field => body[field] !== undefined &&
             body[field] !== null &&
             body[field] !== ''
  ) && Number.isFinite(Number(body.consultation_fee)) &&
       Number(body.consultation_fee) >= 0;
}

// GET /api/doctors
async function getAllDoctors(req, res) {
  try {
    const doctors = await Doctor.findAll();

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors'
    });
  }
}

// GET /api/doctors/:id
async function getDoctorById(req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor'
    });
  }
}

// POST /api/doctors
async function createDoctor(req, res) {
  try {
    if (!validateDoctor(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Valid doctor fields are required'
      });
    }

    const doctor = await Doctor.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    });
  } catch (error) {
    console.error(error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Doctor email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create doctor'
    });
  }
}

// PUT /api/doctors/:id
async function updateDoctor(req, res) {
  try {
    if (!validateDoctor(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Valid doctor fields are required'
      });
    }

    const existing = await Doctor.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const doctor = await Doctor.update(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    });
  } catch (error) {
    console.error(error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Doctor email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update doctor'
    });
  }
}

// DELETE /api/doctors/:id
async function deleteDoctor(req, res) {
  try {
    const deleted = await Doctor.remove(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error(error.message);

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete a doctor with existing appointments'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor'
    });
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
