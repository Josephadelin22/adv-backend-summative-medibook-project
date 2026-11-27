require('dotenv').config();

const express = require('express');
const path = require('path');
const pool = require('./config/database');
const redis = require('./config/redis');

const app = express();
// Serve frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Serve translation files
app.use('/locales', express.static(path.join(__dirname, '../locales')));

// Course feedback page
app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/feedback.html'));
});

const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const reportRoutes = require('./routes/report.routes');
// Parse incoming JSON requests
app.use(express.json());
app.use('/api/doctors', doctorRoutes);
app.use('/api/reports', reportRoutes);

app.use('/api/patients', patientRoutes);

app.use('/api/appointments', appointmentRoutes);

// Basic health-check endpoint
app.get('/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        try {
            await connection.ping();
        } finally {
            connection.release();
        }

        const redisStatus = await redis.ping();

        res.status(200).json({
            status: 'healthy',
            application: 'MediBook API',
            services: {
                mysql: 'connected',
                redis: redisStatus === 'PONG' ? 'connected' : 'unavailable'
            }
        });
    } catch (error) {
        console.error('Health check error:', error);

        res.status(503).json({
            status: 'unhealthy',
            message: 'A required service is unavailable'
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`MediBook API running on port ${PORT}`);
});
