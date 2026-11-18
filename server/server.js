// server.js — ZORVELLAE Express Application Entry Point

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: false,
});

const connectDB = require('./config/db');
const { allowedOrigins } = require('./config/security');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// --- Route imports ---
const healthRoutes = require('./routes/health.routes');
const productRoutes = require('./routes/products.routes');
const categoryRoutes = require('./routes/categories.routes');
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
// Additional routes will be imported here as they are built:
// const cartRoutes    = require('./routes/cart.routes');
// const orderRoutes   = require('./routes/order.routes');
// const contactRoutes = require('./routes/contact.routes');

// ==========================================
// Bootstrap
// ==========================================
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking — server starts even if DB is unavailable)
connectDB();

// ==========================================
// Security Middleware
// ==========================================

// Helmet: sets secure HTTP response headers
app.use(helmet());

// CORS: allow requests from the React frontend only
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting: global limit to prevent abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// Stricter limiter for authentication endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

// ==========================================
// General Middleware
// ==========================================

// Request logger (dev: coloured, production: combined)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// API Routes
// ==========================================
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Placeholder — routes will be added per phase:
// app.use('/api/cart', cartRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/contact', contactRoutes);

// Root ping (non-API)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ZORVELLAE API is running.',
    docs: '/api/health',
  });
});

// ==========================================
// Error Handling (must be last)
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════╗');
  console.log('  ║         Z O R V E L L A E             ║');
  console.log('  ║     Science-Led Botanical Skincare    ║');
  console.log('  ╚═══════════════════════════════════════╝');
  console.log('');
  console.log(`  🚀 API Server  → http://localhost:${PORT}`);
  console.log(`  🏥 Health Check → http://localhost:${PORT}/api/health`);
  console.log(`  🌍 Environment  → ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

module.exports = app;
