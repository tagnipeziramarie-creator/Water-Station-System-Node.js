import pool from './src/config/database.js';

(async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute('SHOW TABLES');
    console.log('Tables:', rows);
    conn.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
})();