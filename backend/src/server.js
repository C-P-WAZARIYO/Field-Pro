/**
 * AuthX Server Entry Point
 * Starts the Express server with Prisma 7 & Argon2id
 */
require('dotenv').config();
const app = require('./app');
const config = require('./config');
const prisma = require('./config/database');

const PORT = config.port || 5000;

const startServer = async () => {
  try {
    console.log('⏳ Starting AuthX services...');

    // 1. Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // 2. Start listening
    const server = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║      🔐 AuthX Authentication Service                  ║
║                                                       ║
║      Environment: ${config.env.padEnd(27)} ║
║      Port: ${String(PORT).padEnd(34)} ║
║      API Version: ${config.apiVersion.padEnd(27)} ║
║                                                       ║
║      Endpoints:                                       ║
║      • Health: http://localhost:${PORT}/api/v1/health      ║
║      • Auth:   http://localhost:${PORT}/api/v1/auth        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Set longer timeout for large file uploads (5 minutes)
    server.setTimeout(5 * 60 * 1000);

    // 3. Graceful shutdown logic
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('HTTP server closed');
        await prisma.$disconnect();
        console.log('Database connection closed');
        process.exit(0);
      });

      // Force close after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    if (prisma) await prisma.$disconnect();
    process.exit(1);
  }
};

// CRITICAL: Actually call the function to start the process!
startServer();