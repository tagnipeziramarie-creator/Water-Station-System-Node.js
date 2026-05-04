import db from '../src/config/database.js';
import { createUser } from '../src/models/User.js';
import { createInventory } from '../src/models/Inventory.js';
import { createWaterProduct } from '../src/models/WaterProduct.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create test users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);
    const deliveryPassword = await bcrypt.hash('delivery123', 10);

    await createUser({
      userId: uuidv4(),
      name: 'Admin User',
      email: 'admin@waterstation.local',
      password: adminPassword,
      phone: '09123456789',
      role: 'admin',
      address: '123 Admin St',
      barangay: 'Barangay 1',
    });

    await createUser({
      userId: uuidv4(),
      name: 'Test Customer',
      email: 'customer@waterstation.local',
      password: customerPassword,
      phone: '09987654321',
      role: 'customer',
      address: '456 Customer Ave',
      barangay: 'Barangay 2',
    });

    await createUser({
      userId: uuidv4(),
      name: 'Delivery Staff',
      email: 'delivery@waterstation.local',
      password: deliveryPassword,
      phone: '09112233445',
      role: 'delivery',
      address: '789 Depot Rd',
      barangay: 'Barangay 3',
    });

    // Create water products
    await createWaterProduct({
      product_id: 'PROD-001',
      name: 'Pure Water',
      description: 'High quality pure water',
      container_sizes: JSON.stringify(['5L', '10L', '20L']),
      price: 150.00,
      is_active: true,
    });

    await createWaterProduct({
      product_id: 'PROD-002',
      name: 'Mineral Water',
      description: 'Mineral enriched water',
      container_sizes: JSON.stringify(['5L', '10L', '20L']),
      price: 200.00,
      is_active: true,
    });

    // Create inventory
    await createInventory({
      product_id: 'PROD-001',
      container_size: '5L',
      quantity_on_hand: 100,
      reorder_level: 20,
      reorder_quantity: 50,
      cost_per_unit: 50.00,
      selling_price: 150.00,
    });

    await createInventory({
      product_id: 'PROD-001',
      container_size: '10L',
      quantity_on_hand: 80,
      reorder_level: 15,
      reorder_quantity: 40,
      cost_per_unit: 80.00,
      selling_price: 250.00,
    });

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
