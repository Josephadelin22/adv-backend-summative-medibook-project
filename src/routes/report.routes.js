
const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');

router.get('/appointments', reportController.getAppointmentSummary);
router.get('/doctors', reportController.getDoctorStatistics);
router.get('/revenue', reportController.getRevenueStatistics);

module.exports = router;
