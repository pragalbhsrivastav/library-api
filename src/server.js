import 'dotenv/config';
import app from './app.js';
import pool from './config/db.js';

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

start();