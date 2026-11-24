
const Patient = require('../models/patient.model');

// GET /api/patients
async function getAllPatients(req, res) {
  try {
    const patients = await Patient.findAll();

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Get patients error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patients'
    });
  }
}

// GET /api/patients/:id
async function getPatientById(req, res) {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient'
    });
  }
}

// POST /api/patients
async function createPatient(req, res) {
  try {
    const { first_name, last_name, email, phone } = req.body;

    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All patient fields are required'
      });
    }

    const patient = await Patient.create({
      first_name,
      last_name,
      email,
      phone
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    console.error('Create patient error:', error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email or phone number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create patient'
    });
  }
}

// PUT /api/patients/:id
async function updatePatient(req, res) {
  try {
    const { first_name, last_name, email, phone } = req.body;

    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All patient fields are required'
      });
    }

    const existingPatient = await Patient.findById(req.params.id);

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const patient = await Patient.update(req.params.id, {
      first_name,
      last_name,
      email,
      phone
    });

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient error:', error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email or phone number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update patient'
    });
  }
}

// DELETE /api/patients/:id
async function deletePatient(req, res) {
  try {
    const deleted = await Patient.remove(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error.message);

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete a patient with existing appointments'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete patient'
    });
  }
}

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};
