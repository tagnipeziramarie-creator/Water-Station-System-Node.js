import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.AIVEN_DB_HOST,
  port: Number(process.env.AIVEN_DB_PORT),
  user: process.env.AIVEN_DB_USER,
  password: process.env.AIVEN_DB_PASSWORD,
  database: process.env.AIVEN_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  },
  enableKeepAlive: true
});

pool.getConnection()
  .then((connection) => {
    console.log('✅ Connected to Aiven MySQL');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ DB Connection Failed:', err.message);
  });

export default pool;