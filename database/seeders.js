import db from '../src/config/database.js';
import { createUser } from '../src/models/User.js';
import { createInventory } from '../src/models/Inventory.js';
import { createWaterProduct } from '../src/models/WaterProduct.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// ✅ FIX: use EMAIL (since no id/user_id exists)
const userExists = async (email) => {
  const [rows] = await db.query(
    'SELECT email FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows.length > 0;
};

// ✅ FIX: already correct
const productExists = async (productId) => {
  const [rows] = await db.query(
    'SELECT product_id FROM water_products WHERE product_id = ? LIMIT 1',
    [productId]
  );
  return rows.length > 0;
};

// ✅ FIX: no inventory_id → use product_id instead
const inventoryExists = async (productId, size) => {
  const [rows] = await db.query(
    'SELECT product_id FROM inventories WHERE product_id = ? AND container_size = ? LIMIT 1',
    [productId, size]
  );
  return rows.length > 0;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // 🔐 Passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);
    const deliveryPassword = await bcrypt.hash('delivery123', 10);

    // 👥 USERS
    const users = [
      {
        userId: uuidv4(),
        name: 'Admin User',
        email: 'admin@waterstation.local',
        password: adminPassword,
        phone: '09123456789',
        role: 'admin',
        address: 'Main Office',
        barangay: 'Barangay 1',
      },
      {
        userId: uuidv4(),
        name: 'Test Customer',
        email: 'customer@waterstation.local',
        password: customerPassword,
        phone: '09987654321',
        role: 'customer',
        address: 'Customer Address',
        barangay: 'Barangay 2',
      },
      {
        userId: uuidv4(),
        name: 'Delivery Staff',
        email: 'delivery@waterstation.local',
        password: deliveryPassword,
        phone: '09112233445',
        role: 'delivery',
        address: 'Delivery Area',
        barangay: 'Barangay 3',
      },
    ];

    for (const user of users) {
      if (await userExists(user.email)) {
        console.log(`⚠️ User already exists: ${user.email}`);
      } else {
        await createUser(user);
        console.log(`✅ User created: ${user.email}`);
      }
    }

    // 💧 PRODUCTS
    const products = [
      {
        product_id: 'PROD-001',
        name: 'Pure Water',
        description: 'High quality purified water',
        container_sizes: JSON.stringify(['5L', '10L', '20L']),
        price: 150,
        is_active: true,
      },
      {
        product_id: 'PROD-002',
        name: 'Mineral Water',
        description: 'Mineral enriched water',
        container_sizes: JSON.stringify(['5L', '10L', '20L']),
        price: 200,
        is_active: true,
      },
    ];

    for (const product of products) {
      if (await productExists(product.product_id)) {
        console.log(`⚠️ Product already exists: ${product.name}`);
      } else {
        await createWaterProduct(product);
        console.log(`✅ Product created: ${product.name}`);
      }
    }

    // 📦 INVENTORY
    const inventories = [
      {
        product_id: 'PROD-001',
        container_size: '5L',
        quantity_on_hand: 100,
        reorder_level: 20,
        reorder_quantity: 50,
        cost_per_unit: 50,
        selling_price: 150,
      },
      {
        product_id: 'PROD-001',
        container_size: '10L',
        quantity_on_hand: 80,
        reorder_level: 15,
        reorder_quantity: 40,
        cost_per_unit: 80,
        selling_price: 250,
      },
      {
        product_id: 'PROD-002',
        container_size: '5L',
        quantity_on_hand: 100,
        reorder_level: 20,
        reorder_quantity: 50,
        cost_per_unit: 70,
        selling_price: 200,
      },
      {
        product_id: 'PROD-002',
        container_size: '10L',
        quantity_on_hand: 80,
        reorder_level: 15,
        reorder_quantity: 40,
        cost_per_unit: 100,
        selling_price: 300,
      },
    ];

    for (const item of inventories) {
      if (await inventoryExists(item.product_id, item.container_size)) {
        console.log(`⚠️ Inventory exists: ${item.product_id} - ${item.container_size}`);
      } else {
        await createInventory(item);
        console.log(`✅ Inventory created: ${item.product_id} - ${item.container_size}`);
      }
    }

    console.log('🎉 Seeding completed successfully!');

    console.log('\n🔐 Default Accounts:');
    console.log('Admin → admin@waterstation.local / admin123');
    console.log('Customer → customer@waterstation.local / customer123');
    console.log('Delivery → delivery@waterstation.local / delivery123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await db.end();
  }
};

// ✅ FORCE RUN
seedDatabase();