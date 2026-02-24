import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in your .env file');
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});