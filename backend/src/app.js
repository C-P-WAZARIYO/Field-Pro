/**
 * Express Application Setup
 * Configures middleware and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// 1. GLOBAL SETTINGS & SECURITY HEADERS
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 2. CORS
app.use(cors(config.cors));

// 3. BODY PARSING (MOVE THIS UP!)
// This must happen BEFORE rate limiters and routes so req.body exists
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 4. LOGGING
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 5. RATE LIMITING (AFTER body parsing)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Stricter rate limit for auth endpoints
// Development: 100 attempts per 15 min (adjusted for testing)
// Production: Consider lowering to 5-10 per 15 min to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMITED',
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// 6. API ROUTES
app.use(`/api/${config.apiVersion}`, routes);

// 7. ROOT & ERROR HANDLING
app.get('/', (req, res) => {
  res.json({
    name: 'fintech API',
    version: config.apiVersion,
    description: 'Production-grade authentication and authorization service',
  });
  console.log(req.body) // Log the request body to see what is being sent;

});

app.use(notFound);
app.use(errorHandler);

module.exports = app;