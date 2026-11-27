
const redis = require('../config/redis');

const JOB_QUEUE = 'medibook:jobs';

// Generate a consistent key for each doctor and time slot
function getWaitlistKey(doctorId, appointmentDateTime) {
  const date = new Date(appointmentDateTime);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid appointment date');
  }

  const slot = date.toISOString().slice(0, 16).replace(/[-:T]/g, '');

  return `medibook:waitlist:${doctorId}:${slot}`;
}

// Add a patient to the end of the waiting list
async function addToWaitlist(data) {
  const key = getWaitlistKey(
    data.doctor_id,
    data.appointment_datetime
  );

  await redis.rpush(key, JSON.stringify(data));

  return redis.llen(key);
}

// Retrieve the next patient in the queue
async function getNextPatient(doctorId, appointmentDateTime) {
  const key = getWaitlistKey(doctorId, appointmentDateTime);

  const patient = await redis.lpop(key);

  return patient ? JSON.parse(patient) : null;
}

// Add a background job to Redis
async function enqueueJob(job) {
  await redis.rpush(JOB_QUEUE, JSON.stringify(job));
}

module.exports = {
  addToWaitlist,
  getNextPatient,
  enqueueJob,
  getWaitlistKey,
  JOB_QUEUE
};
