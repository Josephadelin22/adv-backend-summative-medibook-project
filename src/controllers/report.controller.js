
const Report = require('../models/report.model');

// GET /api/reports/appointments
async function getAppointmentSummary(req, res) {
  try {
    const summary = await Report.getAppointmentSummary();

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Appointment summary error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to generate appointment summary'
    });
  }
}

// GET /api/reports/doctors
async function getDoctorStatistics(req, res) {
  try {
    const statistics = await Report.getDoctorStatistics();

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Doctor statistics error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to generate doctor statistics'
    });
  }
}

// GET /api/reports/revenue
async function getRevenueStatistics(req, res) {
  try {
    const revenue = await Report.getRevenueStatistics();

    res.status(200).json({
      success: true,
      data: revenue
    });
  } catch (error) {
    console.error('Revenue statistics error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue statistics'
    });
  }
}

module.exports = {
  getAppointmentSummary,
  getDoctorStatistics,
  getRevenueStatistics
};
