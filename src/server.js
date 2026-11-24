require('dotenv').config();

const express = require('express');
const pool = require('./config/database');
const redis = require('./config/redis');

const app = express();

// Parse incoming JSON requests
app.use(express.json());

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
