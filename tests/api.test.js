
const request = require('supertest');

const API_URL = 'http://127.0.0.1:3000';

describe('MediBook API - Appointment Validation', () => {

    test('should reject a booking without required data', async () => {
        const response = await request(API_URL)
            .post('/api/appointments')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test('should reject invalid patient and doctor IDs', async () => {
        const response = await request(API_URL)
            .post('/api/appointments')
            .send({
                patient_id: 0,
                doctor_id: 1,
                appointment_datetime: '2099-12-15T09:00:00'
            });

        expect(response.status).toBe(400);
        expect(response.body.message)
            .toBe('Valid patient_id and doctor_id are required');
    });

    test('should reject a booking without an appointment date', async () => {
        const response = await request(API_URL)
            .post('/api/appointments')
            .send({
                patient_id: 1,
                doctor_id: 1
            });

        expect(response.status).toBe(400);
        expect(response.body.message)
            .toBe('appointment_datetime is required');
    });

    test('should reject an invalid appointment date', async () => {
        const response = await request(API_URL)
            .post('/api/appointments')
            .send({
                patient_id: 1,
                doctor_id: 1,
                appointment_datetime: 'invalid-date'
            });

        expect(response.status).toBe(400);
    });

    test('should reject cancellation with an invalid ID', async () => {
        const response = await request(API_URL)
            .patch('/api/appointments/0/cancel');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

});
