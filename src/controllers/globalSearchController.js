import pool from '../config/database.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const searchTerm = `%${query}%`;
    const connection = await pool.getConnection();

    // Search in orders
    const [orders] = await connection.execute(
      `SELECT * FROM orders WHERE orderId LIKE ? OR product LIKE ? OR delivery_address LIKE ? LIMIT 10`,
      [searchTerm, searchTerm, searchTerm]
    );

    // Search in users (admin feature)
    let users = [];
    if (req.user?.role === 'admin') {
      const [userResults] = await connection.execute(
        `SELECT userId, name, email, phone, role FROM users WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? LIMIT 10`,
        [searchTerm, searchTerm, searchTerm]
      );
      users = userResults;
    }

    connection.release();

    res.json({
      results: {
        orders,
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};
