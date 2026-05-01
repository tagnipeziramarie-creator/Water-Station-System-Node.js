import pool from '../src/config/database.js';

const runMigrations = async () => {
  try {
    console.log('🔄 Checking database tables...');
    
    const connection = await pool.getConnection();

    // Create Users table
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
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create Orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        orderId VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        customer_id VARCHAR(255),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        order_status ENUM('pending', 'confirmed', 'delivered', 'cancelled') DEFAULT 'pending',
        total_amount DECIMAL(10, 2),
        delivery_address TEXT,
        product VARCHAR(255),
        quantity INT,
        payment ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
        total_price DECIMAL(10, 2),
        status VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(userId)
      )
    `);

    // Create Order Items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(255),
        product_id VARCHAR(255),
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(orderId)
      )
    `);

    // Create Payments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(255),
        payment_method ENUM('COD', 'cash_on_delivery') DEFAULT 'COD',
        payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        amount DECIMAL(10, 2) NOT NULL,
        receipt_url TEXT,
        paid_at TIMESTAMP NULL,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(orderId)
      )
    `);

    // Create Deliveries table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(255),
        delivery_personnel_id VARCHAR(255),
        delivery_status ENUM('pending', 'in_transit', 'delivered', 'failed', 'rescheduled') DEFAULT 'pending',
        scheduled_date TIMESTAMP NULL,
        delivered_date TIMESTAMP NULL,
        delivery_address TEXT,
        delivery_notes TEXT,
        payment_received BOOLEAN DEFAULT FALSE,
        payment_amount DECIMAL(10, 2),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(orderId),
        FOREIGN KEY (delivery_personnel_id) REFERENCES users(userId)
      )
    `);

    // Create Delivery Assignments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS delivery_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        delivery_id INT,
        delivery_personnel_id VARCHAR(255),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
        FOREIGN KEY (delivery_personnel_id) REFERENCES users(userId)
      )
    `);

    // Create Inventories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id VARCHAR(255),
        container_size VARCHAR(255),
        quantity_on_hand INT DEFAULT 0,
        reorder_level INT,
        reorder_quantity INT,
        cost_per_unit DECIMAL(10, 2),
        selling_price DECIMAL(10, 2),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create Addresses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        street_address TEXT,
        barangay VARCHAR(255),
        city VARCHAR(255),
        province VARCHAR(255),
        zip_code VARCHAR(10),
        is_default BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(userId)
      )
    `);

    // Create Notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        type ENUM('order', 'delivery', 'payment', 'system') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_entity_id VARCHAR(255),
        read_at TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(userId)
      )
    `);

    // Create Water Products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS water_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id VARCHAR(255) UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        container_sizes JSON,
        price DECIMAL(10, 2) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create Predictive Reports table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS predictive_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_type ENUM('sales', 'inventory', 'delivery', 'customer_behavior') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        data JSON,
        predictions JSON,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log('✅ All database tables created/verified successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
