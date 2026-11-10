import 'dotenv/config';
import pg from 'pg';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in backend/.env');
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  connectionTimeoutMillis: 10000,
  max: 10
});
pool.on('error', error => console.error('Database connection error:', error.code || error.name));
