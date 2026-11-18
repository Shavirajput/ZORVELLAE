// routes/health.routes.js
// Health-check endpoints — no auth required.

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * GET /api/health
 * Returns server status and MongoDB connection state.
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const status = {
    success: true,
    service: 'ZORVELLAE API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      name: dbState === 1 ? mongoose.connection.name : null,
      status: dbStateMap[dbState] || 'unknown',
      connected: dbState === 1,
    },
  };

  // Return 200 regardless — health check should always respond
  res.status(200).json(status);
});

module.exports = router;
