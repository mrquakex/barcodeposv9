import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@barcodepos.com' },
    update: {},
    create: {
      email: 'admin@barcodepos.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // 2. Create Categories
  const categories = [
    { name: 'Beverages' },
    { name: 'Snacks' },
    { name: 'Electronics' },
    { name: 'Clothing' },
    { name: 'Home & Kitchen' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    if (!existing) {
      const created = await prisma.category.create({
        data: cat,
      });
      createdCategories.push(created);
    } else {
      createdCategories.push(existing);
    }
  }

  console.log(`✅ ${createdCategories.length} categories created/found`);

  // 3. Create Sample Products
  const products = [
    {
      barcode: '1234567890123',
      sku: 'SKU-COLA-330',
      name: 'Coca Cola 330ml',
      sellPrice: 15.0,
      buyPrice: 10.0,
      stock: 100,
      minStock: 10,
      unit: 'Adet',
      taxRate: 18,
      categoryId: createdCategories[0].id,
    },
    {
      barcode: '1234567890124',
      sku: 'SKU-LAYS-150',
      name: 'Lays Chips 150g',
      sellPrice: 25.0,
      buyPrice: 18.0,
      stock: 50,
      minStock: 10,
      unit: 'Adet',
      taxRate: 18,
      categoryId: createdCategories[1].id,
    },
    {
      barcode: '1234567890125',
      sku: 'SKU-USB-CABLE',
      name: 'Samsung USB Cable',
      sellPrice: 45.0,
      buyPrice: 30.0,
      stock: 30,
      minStock: 5,
      unit: 'Adet',
      taxRate: 18,
      categoryId: createdCategories[2].id,
    },
  ];

  const createdProducts = await Promise.all(
    products.map((product) =>
      prisma.product.upsert({
        where: { barcode: product.barcode },
        update: {},
        create: product,
      })
    )
  );

  console.log(`✅ ${createdProducts.length} products created`);

  // 4. Create Sample Customer
  const customer = await prisma.customer.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+90 555 123 4567',
      address: 'Istanbul, Turkey',
      debt: 0,
      loyaltyPoints: 0,
      totalSpent: 0,
    },
  });

  console.log('✅ Sample customer created:', customer.name);

  // 5. Create Settings
  const settings = await prisma.settings.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      storeName: 'BarcodePOS Store',
      storeAddress: 'Istanbul, Turkey',
      storePhone: '+90 555 000 0000',
      storeEmail: 'info@barcodepos.com',
      currency: 'TRY',
      locale: 'tr-TR',
      timezone: 'Europe/Istanbul',
      theme: 'light',
      receiptFooter: 'Thank you for your purchase!',
    },
  });

  console.log('✅ Settings created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
