
const request = require('supertest');

const API_URL = 'http://127.0.0.1:3000';

describe('MediBook API - Resource and Report Endpoints', () => {

    test('should retrieve all doctors', async () => {
        const response = await request(API_URL)
            .get('/api/doctors');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should retrieve all patients', async () => {
        const response = await request(API_URL)
            .get('/api/patients');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should retrieve all appointments', async () => {
        const response = await request(API_URL)
            .get('/api/appointments');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should return 404 for a non-existing appointment', async () => {
        const response = await request(API_URL)
            .get('/api/appointments/999999');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test('should retrieve appointment summary report', async () => {
        const response = await request(API_URL)
            .get('/api/reports/appointments');

        expect(response.status).toBe(200);
    });

    test('should retrieve doctor statistics report', async () => {
        const response = await request(API_URL)
            .get('/api/reports/doctors');

        expect(response.status).toBe(200);
    });

    test('should retrieve revenue statistics report', async () => {
        const response = await request(API_URL)
            .get('/api/reports/revenue');

        expect(response.status).toBe(200);
    });

});
