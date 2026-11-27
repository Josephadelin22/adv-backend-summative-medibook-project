
require('dotenv').config();

const crypto = require('crypto');
const redis = require('../config/redis');
const Appointment = require('../models/appointment.model');
const Waitlist = require('../utils/waitlist');
const { logEvent } = require('../utils/auditLogger');

/**
 * Process a job retrieved from the Redis queue.
 */
async function processJob(job) {
    if (job.type !== 'PROMOTE_WAITLIST') {
        console.log('Unknown job type:', job.type);
        return;
    }

    const doctorId = job.doctor_id ?? job.doctorId;
    const appointmentDateTime =
        job.appointment_datetime ?? job.appointmentDateTime;

    
    if (!doctorId || !appointmentDateTime) {
        console.error('Invalid job data:', job);
        return;
    }    

    try {
        // Retrieve the first patient waiting for this slot.
        const patient = await Waitlist.getNextPatient(
            doctorId,
            appointmentDateTime
        );

        if (!patient) {
            console.log('No patients waiting for this appointment slot.');
            return;
        }

        try {
            // Generate a unique appointment reference.
            const reference =
                `APT-${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;

            // Create the appointment in MySQL.
            console.log('WAITLIST PATIENT DATA:', patient);
            const appointment = await Appointment.create({
                reference,
                patient_id: patient.patient_id,
                doctor_id: patient.doctor_id,
                appointment_datetime: patient.appointment_datetime,
                consultation_fee: patient.consultation_fee,
                amount_paid: patient.amount_paid
                
            });

            // Record the successful promotion.
            await logEvent('WAITLIST_PATIENT_PROMOTED', {
                patientId: patient.patient_id,
                doctorId: patient.doctor_id,
                appointmentId: appointment.id
            });

            console.log('WAITLIST PATIENT PROMOTED:', appointment);

            // Simulate sending a notification to the patient.
            console.log(
                `NOTIFICATION: Patient ${patient.patient_id} has been assigned an appointment.`
            );

        } catch (error) {
            // If the slot was taken, put the patient back at the front.
            if (error.code === 'ER_DUP_ENTRY') {
                const key = Waitlist.getWaitlistKey(
                    doctorId,
                    appointmentDateTime
                );

                await redis.lpush(key, JSON.stringify(patient));

                console.log('Slot already taken. Patient returned to waitlist.');
                return;
            }

            // Requeue the patient if appointment creation fails.
            const key = Waitlist.getWaitlistKey(
                doctorId,
                appointmentDateTime
            );

            await redis.lpush(key, JSON.stringify(patient));

            console.error('Appointment promotion failed:', error.message);
        }

    } catch (error) {
        console.error('Job processing failed:', error.message);
    }
}

/**
 * Start the Redis worker.
 */
async function startWorker() {
    console.log('MediBook Redis Worker started.');
    console.log('Waiting for jobs...');

    while (true) {
        try {
            // Block until a new job is available.
            const result = await redis.brpop(Waitlist.JOB_QUEUE, 0);

            if (!result || !result[1]) {
                continue;
            }

            const job = JSON.parse(result[1]);

            console.log('New job received:', job);

            await processJob(job);

        } catch (error) {
            console.error('Worker error:', error.message);
        }
    }
}

// Start the worker.
startWorker();
