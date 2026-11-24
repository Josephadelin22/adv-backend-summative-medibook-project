
const crypto = require('crypto');

const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');

// GET /api/appointments
async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.findAll();

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments'
    });
  }
}

// GET /api/appointments/:id
async function getAppointmentById(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment'
    });
  }
}

// POST /api/appointments
async function createAppointment(req, res) {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_datetime,
      amount_paid = 0
    } = req.body;

    // Validate required fields
    if (
      !Number.isInteger(Number(patient_id)) ||
      Number(patient_id) <= 0 ||
      !Number.isInteger(Number(doctor_id)) ||
      Number(doctor_id) <= 0 ||
      !appointment_datetime
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid patient_id, doctor_id and appointment_datetime are required'
      });
    }

    // Validate appointment date
    const appointmentDate = new Date(appointment_datetime);

    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date'
      });
    }

    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Check that patient exists
    const patient = await Patient.findById(Number(patient_id));

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check that doctor exists
    const doctor = await Doctor.findById(Number(doctor_id));

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Use the doctor's current fee, not a price sent by the client
    const fee = Number(doctor.consultation_fee);
    const payment = Number(amount_paid);

    if (
      !Number.isFinite(payment) ||
      payment < 0 ||
      payment > fee
    ) {
      return res.status(400).json({
        success: false,
        message: 'amount_paid must be between 0 and the consultation fee'
      });
    }
    
    // Generate a unique reference for the appointment
    const reference = `APT-${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;

    const appointment = await Appointment.create({
      reference,
      patient_id: Number(patient_id),
      doctor_id: Number(doctor_id),
      appointment_datetime,
      consultation_fee: fee,
      amount_paid: payment
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This doctor already has an appointment at that time'
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient or doctor'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to book appointment'
    });
  }
}

// Calculate refund according to cancellation notice
function calculateRefund(amountPaid, minutesBeforeAppointment) {
  let percentage = 0;

  if (minutesBeforeAppointment > 24 * 60) {
    percentage = 100;
  } else if (minutesBeforeAppointment >= 12 * 60) {
    percentage = 75;
  } else if (minutesBeforeAppointment >= 2 * 60) {
    percentage = 50;
  }

  return Number((amountPaid * percentage / 100).toFixed(2));
}

// PATCH /api/appointments/:id/cancel
async function cancelAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'booked') {
      return res.status(409).json({
        success: false,
        message: 'Only booked appointments can be cancelled'
      });
    }

    const appointmentTime = new Date(appointment.appointment_datetime);
    const now = new Date();

    const minutesBeforeAppointment =
      (appointmentTime.getTime() - now.getTime()) / (1000 * 60);

    const refundAmount = calculateRefund(
      Number(appointment.amount_paid),
      minutesBeforeAppointment
    );

    const cancelled = await Appointment.cancel(
      appointment.id,
      refundAmount
    );

    if (!cancelled) {
      return res.status(409).json({
        success: false,
        message: 'Appointment could not be cancelled. Its status may have changed.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment_id: appointment.id,
        amount_paid: Number(appointment.amount_paid),
        refund_percentage:
          Number(appointment.amount_paid) > 0
            ? Number((refundAmount / Number(appointment.amount_paid) * 100).toFixed(2))
            : 0,
        refund_amount: refundAmount
      }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
}

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  cancelAppointment,
  calculateRefund
};
