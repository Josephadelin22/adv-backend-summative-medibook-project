
const fs = require('fs').promises;
const path = require('path');

const logDirectory = path.join(__dirname, '../../logs');
const logFile = path.join(logDirectory, 'audit.log');

async function logEvent(event, details = {}) {
  try {
    await fs.mkdir(logDirectory, { recursive: true });

    const entry = {
      timestamp: new Date().toISOString(),
      event,
      details
    };

    await fs.appendFile(
      logFile,
      JSON.stringify(entry) + '\n',
      'utf8'
    );
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
}

module.exports = { logEvent };
