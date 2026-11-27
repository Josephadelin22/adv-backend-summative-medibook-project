
// Prevent Redis from opening a real connection during unit tests.
jest.mock('../src/config/redis', () => ({
    rpush: jest.fn(),
    lpop: jest.fn(),
    llen: jest.fn(),
    lpush: jest.fn(),
    brpop: jest.fn()
}));

const {
    calculateRefund,
    validateAppointmentDate
} = require('../src/controllers/appointment.controller');

describe('Appointment Controller - Refund Calculation', () => {

    test('should refund 100% when cancellation is more than 24 hours before', () => {
        expect(calculateRefund(150, 25 * 60)).toBe(150);
    });

    test('should refund 75% when cancellation is exactly 24 hours before', () => {
        expect(calculateRefund(150, 24 * 60)).toBe(112.5);
    });

    test('should refund 75% when cancellation is exactly 12 hours before', () => {
        expect(calculateRefund(150, 12 * 60)).toBe(112.5);
    });

    test('should refund 50% when cancellation is exactly 2 hours before', () => {
        expect(calculateRefund(150, 2 * 60)).toBe(75);
    });

    test('should refund 0% when cancellation is less than 2 hours before', () => {
        expect(calculateRefund(150, 90)).toBe(0);
    });

    test('should calculate decimal refunds correctly', () => {
        expect(calculateRefund(99.99, 12 * 60)).toBe(74.99);
    });

});

describe('Appointment Controller - Date Validation', () => {

    test('should accept a valid appointment at 09:00', () => {
        expect(
            validateAppointmentDate('2099-12-15T09:00:00')
        ).toEqual({ valid: true });
    });

    test('should accept the last appointment slot at 16:30', () => {
        expect(
            validateAppointmentDate('2099-12-15T16:30:00')
        ).toEqual({ valid: true });
    });

    test('should reject an appointment before 09:00', () => {
        expect(
            validateAppointmentDate('2099-12-15T08:30:00').valid
        ).toBe(false);
    });

    test('should reject an appointment at 17:00', () => {
        expect(
            validateAppointmentDate('2099-12-15T17:00:00').valid
        ).toBe(false);
    });

    test('should reject appointment times that are not on a 30-minute interval', () => {
        expect(
            validateAppointmentDate('2099-12-15T09:15:00').valid
        ).toBe(false);
    });

    test('should reject appointment times with non-zero seconds', () => {
        expect(
            validateAppointmentDate('2099-12-15T09:00:30').valid
        ).toBe(false);
    });

    test('should reject an invalid date', () => {
        expect(
            validateAppointmentDate('invalid-date').valid
        ).toBe(false);
    });

    test('should reject a date in the past', () => {
        expect(
            validateAppointmentDate('2020-01-01T09:00:00').valid
        ).toBe(false);
    });

});
