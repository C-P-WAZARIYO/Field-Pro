/**
 * Database Configuration (Updated for Prisma 7)
 * Prisma client setup with Driver Adapter for PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// 1. Set up the PostgreSQL connection pool using your .env URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Initialize the Prisma Driver Adapter
const adapter = new PrismaPg(pool);

// 3. Create the Prisma Client instance using the adapter
const prisma = new PrismaClient({
  adapter, // This is the most important line for Prisma 7
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  errorFormat: 'pretty',
});

// Graceful shutdown handling
const shutdown = async () => {
  console.log('🔌 Disconnecting Prisma and closing database pool...');
  await prisma.$disconnect();
  await pool.end();
};

process.on('beforeExit', async () => {
  await shutdown();
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await shutdown();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await shutdown();
  process.exit(1);
});

module.exports = prisma;