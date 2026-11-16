import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

// idle connection mein error aaye to app crash na ho
pool.on('error', (err) => {
  console.error('Unexpected DB error:', err);
});

export default pool;