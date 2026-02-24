require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },

  
 
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true' || false,
    httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false', // Defaults to true
    // Use 'lax' by default for local development to make XHR refresh requests more reliable.
    // For production, consider 'none' with secure=true when using HTTPS and cross-site cookies.
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  // Security: Argon2id Parameters
  argon2: {
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, 
    maxRequests: 100,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'https://field-pro-six.vercel.app',
    credentials: true,
  }
};

module.exports = config;