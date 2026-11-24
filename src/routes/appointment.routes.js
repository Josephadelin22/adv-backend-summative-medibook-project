
const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointment.controller');

// GET /api/appointments
router.get('/', appointmentController.getAllAppointments);

// GET /api/appointments/:id
router.get('/:id', appointmentController.getAppointmentById);

// POST /api/appointments
router.post('/', appointmentController.createAppointment);

// PATCH /api/appointments/:id/cancel
router.patch('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;
