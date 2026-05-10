import pool from '../src/config/database.js';

console.log('🚀 Starting migration...');

const runMigrations = async () => {
  let connection;

  try {
    console.log('🔄 Connecting to database...');

    // =========================================
    // CONNECT DATABASE
    // =========================================
    connection = await pool.getConnection();

    console.log('✅ Connected to Aiven MySQL');

    // =========================================
    // USERS TABLE
    // =========================================
    console.log('➡️ Creating users table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        userId VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('customer', 'delivery', 'admin') DEFAULT 'customer',
        address TEXT,
        barangay VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Users table ready');

    // =========================================
    // ORDERS TABLE
    // =========================================
    console.log('➡️ Creating orders table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        orderId VARCHAR(255) PRIMARY KEY,

        customer_id VARCHAR(255),

        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        order_status ENUM(
          'pending',
          'confirmed',
          'in_transit',
          'delivered',
          'cancelled'
        ) DEFAULT 'pending',

        total_amount DECIMAL(10,2),

        delivery_address TEXT,

        product TEXT,

        quantity INT,

        payment ENUM(
          'pending',
          'paid',
          'failed'
        ) DEFAULT 'pending',

        total_price DECIMAL(10,2),

        status VARCHAR(255),

        order_items LONGTEXT,

        valid_id_name VARCHAR(255),

        valid_id_type VARCHAR(100),

        valid_id_data LONGTEXT,

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Orders table ready');

    // =========================================
    // PAYMENTS TABLE
    // =========================================
    console.log('➡️ Creating payments table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,

        order_id VARCHAR(255),

        payment_method ENUM(
          'COD',
          'cash_on_delivery'
        ) DEFAULT 'COD',

        payment_status ENUM(
          'pending',
          'processing',
          'completed',
          'failed'
        ) DEFAULT 'pending',

        amount DECIMAL(10,2),

        receipt_url TEXT,

        paid_at TIMESTAMP NULL,

        notes TEXT,

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Payments table ready');

    // =========================================
    // DELIVERIES TABLE
    // =========================================
    console.log('➡️ Creating deliveries table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id INT AUTO_INCREMENT PRIMARY KEY,

        order_id VARCHAR(255),

        delivery_personnel_id VARCHAR(255),

        delivery_status ENUM(
          'pending',
          'in_transit',
          'delivered',
          'failed'
        ) DEFAULT 'pending',

        scheduled_date TIMESTAMP NULL,

        delivered_date TIMESTAMP NULL,

        delivery_address TEXT,

        delivery_notes TEXT,

        payment_received BOOLEAN DEFAULT FALSE,

        payment_amount DECIMAL(10,2),

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Deliveries table ready');

    // =========================================
    // INVENTORIES TABLE
    // =========================================
    console.log('➡️ Creating inventories table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventories (
        id INT AUTO_INCREMENT PRIMARY KEY,

        product_id VARCHAR(255),

        container_size VARCHAR(255),

        quantity_on_hand INT DEFAULT 0,

        selling_price DECIMAL(10,2),

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Inventories table ready');

    // =========================================
    // WATER PRODUCTS TABLE
    // =========================================
    console.log('➡️ Creating water products table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS water_products (
        id INT AUTO_INCREMENT PRIMARY KEY,

        product_id VARCHAR(255) UNIQUE,

        name VARCHAR(255),

        description TEXT,

        price DECIMAL(10,2),

        quantity INT DEFAULT 0,

        is_active BOOLEAN DEFAULT TRUE,

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Water products table ready');

    // =========================================
    // RELEASE CONNECTION
    // =========================================
    connection.release();

    console.log('📦 Tables created successfully');
    console.log('✅ All database tables created/verified successfully');

    process.exit(0);

  } catch (error) {

    console.error('❌ Migration failed');
    console.error(error);

    if (connection) {
      connection.release();
    }

    process.exit(1);
  }
};

runMigrations();