
const crypto = require('crypto');

const { logEvent } = require('../utils/auditLogger');

const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const Waitlist = require('../utils/waitlist');

// GET /api/appointments
async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.findAll();

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments'
    });
  }
}

// GET /api/appointments/:id
async function getAppointmentById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment'
    });
  }
}

// Validate appointment date and time
function validateAppointmentDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return {
      valid: false,
      message: 'Invalid appointment date'
    };
  }

  if (date <= new Date()) {
    return {
      valid: false,
      message: 'Appointment date must be in the future'
    };
  }

  // Clinic schedule: 09:00 to 17:00
  // Appointment duration: 30 minutes
  const timeMatch = String(dateValue).match(
    /T(\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!timeMatch) {
    return {
      valid: false,
      message: 'Appointment date must include a valid time'
    };
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const seconds = Number(timeMatch[3] || 0);

  const validTime =
    hours >= 9 &&
    hours < 17 &&
    (minutes === 0 || minutes === 30) &&
    seconds === 0;

  if (!validTime) {
    return {
      valid: false,
      message: 'Appointments must start every 30 minutes between 09:00 and 16:30'
    };
  }

  return { valid: true };
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

    const patientId = Number(patient_id);
    const doctorId = Number(doctor_id);

    // Validate IDs
    if (
      !Number.isInteger(patientId) ||
      patientId <= 0 ||
      !Number.isInteger(doctorId) ||
      doctorId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid patient_id and doctor_id are required'
      });
    }

    // Validate appointment date
    if (!appointment_datetime) {
      return res.status(400).json({
        success: false,
        message: 'appointment_datetime is required'
      });
    }

    const dateValidation = validateAppointmentDate(
      appointment_datetime
    );

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message
      });
    }

    // Check patient
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check doctor
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Retrieve consultation fee from database
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

    // Generate a unique reference (maximum 20 characters)
    const reference =
      `APT-${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;

    let appointment;

    // Attempt to create appointment
    try {
      appointment = await Appointment.create({
        reference,
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_datetime,
        consultation_fee: fee,
        amount_paid: payment
      });

    } catch (error) {

      // Handle occupied appointment slot
      if (error.code === 'ER_DUP_ENTRY') {
        try {
          const position = await Waitlist.addToWaitlist({
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_datetime,
            consultation_fee: fee,
            amount_paid: payment
          });

          // AUDIT LOG: Patient added to waitlist
          await logEvent('PATIENT_ADDED_TO_WAITLIST', {
            patientId,
            doctorId,
            appointmentDate: appointment_datetime,
            position
          });

          return res.status(202).json({
            success: true,
            message: 'Patient added to waiting list',
            data: {
              doctor_id: doctorId,
              appointment_datetime,
              waiting_list_position: position
            }
          });

        } catch (queueError) {
          console.error('Waitlist error:', queueError.message);

          return res.status(503).json({
            success: false,
            message: 'Appointment slot is occupied and waiting list is unavailable'
          });
        }
      }

      throw error;
    }

    // AUDIT LOG: Appointment successfully created
    await logEvent('APPOINTMENT_CREATED', {
      appointmentId: appointment.id,
      reference: appointment.reference,
      patientId,
      doctorId,
      appointmentDate: appointment_datetime,
      amountPaid: payment
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Create appointment error:', error.message);

    if (error.code === 'APPOINTMENT_DAILY_LIMIT') {
      return res.status(409).json({
        success: false,
        message: 'Doctor has reached the maximum of 12 appointments per day'
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient or doctor'
      });
    }

    return res.status(500).json({
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

  return Number(
    (amountPaid * percentage / 100).toFixed(2)
  );
}

// PATCH /api/appointments/:id/cancel
async function cancelAppointment(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(id);

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

    const appointmentTime = new Date(
      appointment.appointment_datetime
    );

    const now = new Date();

    const minutesBeforeAppointment =
      (appointmentTime.getTime() - now.getTime()) / 60000;

    const amountPaid = Number(appointment.amount_paid);

    const refundAmount = calculateRefund(
      amountPaid,
      minutesBeforeAppointment
    );

    // Update appointment in MySQL
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

    // AUDIT LOG: Appointment cancelled
    await logEvent('APPOINTMENT_CANCELLED', {
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      doctorId: appointment.doctor_id,
      refundAmount,
      amountPaid
    });

    // Trigger waitlist processing in Redis
    let waitlistJobQueued = true;

    try {
      await Waitlist.enqueueJob({
        type: 'PROMOTE_WAITLIST',
        doctor_id: appointment.doctor_id,
        appointment_datetime: appointment.appointment_datetime
      });

    } catch (queueError) {
      waitlistJobQueued = false;

      console.error(
        'Failed to enqueue waitlist job:',
        queueError.message
      );
    }

    const refundPercentage =
      amountPaid > 0
        ? Number(
            (refundAmount / amountPaid * 100).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment_id: appointment.id,
        amount_paid: amountPaid,
        refund_percentage: refundPercentage,
        refund_amount: refundAmount,
        waitlist_job_queued: waitlistJobQueued
      }
    });

  } catch (error) {
    console.error('Cancel appointment error:', error.message);

    return res.status(500).json({
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
  calculateRefund,
  validateAppointmentDate
};
