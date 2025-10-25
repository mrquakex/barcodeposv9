import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Veritabanı seed başlıyor...');

  // Admin kullanıcı oluştur
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barcodepos.com' },
    update: {},
    create: {
      email: 'admin@barcodepos.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin kullanıcı oluşturuldu:', admin.email);

  // Kasiyer oluştur
  const cashier = await prisma.user.upsert({
    where: { email: 'kasiyer@barcodepos.com' },
    update: {},
    create: {
      email: 'kasiyer@barcodepos.com',
      password: await bcrypt.hash('kasiyer123', 10),
      name: 'Kasiyer User',
      role: 'CASHIER',
    },
  });

  console.log('✅ Kasiyer kullanıcı oluşturuldu:', cashier.email);

  // Kategoriler oluştur
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: '1' },
      update: {},
      create: { id: '1', name: 'Gıda' },
    }),
    prisma.category.upsert({
      where: { id: '2' },
      update: {},
      create: { id: '2', name: 'İçecek' },
    }),
    prisma.category.upsert({
      where: { id: '3' },
      update: {},
      create: { id: '3', name: 'Temizlik' },
    }),
    prisma.category.upsert({
      where: { id: '4' },
      update: {},
      create: { id: '4', name: 'Kişisel Bakım' },
    }),
  ]);

  console.log('✅ Kategoriler oluşturuldu:', categories.length);

  // Örnek ürünler oluştur
  const products = await Promise.all([
    prisma.product.upsert({
      where: { barcode: '8690504001234' },
      update: {},
      create: {
        barcode: '8690504001234',
        name: 'Ekmek',
        price: 5.50,
        cost: 3.00,
        stock: 100,
        unit: 'Adet',
        taxRate: 8,
        minStock: 20,
        categoryId: '1',
      },
    }),
    prisma.product.upsert({
      where: { barcode: '8690504002234' },
      update: {},
      create: {
        barcode: '8690504002234',
        name: 'Süt 1L',
        price: 25.00,
        cost: 18.00,
        stock: 50,
        unit: 'Adet',
        taxRate: 8,
        minStock: 10,
        categoryId: '1',
      },
    }),
    prisma.product.upsert({
      where: { barcode: '8690504003234' },
      update: {},
      create: {
        barcode: '8690504003234',
        name: 'Kola 330ml',
        price: 15.00,
        cost: 10.00,
        stock: 200,
        unit: 'Adet',
        taxRate: 18,
        minStock: 30,
        categoryId: '2',
      },
    }),
    prisma.product.upsert({
      where: { barcode: '8690504004234' },
      update: {},
      create: {
        barcode: '8690504004234',
        name: 'Deterjan 3kg',
        price: 120.00,
        cost: 85.00,
        stock: 30,
        unit: 'Adet',
        taxRate: 18,
        minStock: 5,
        categoryId: '3',
      },
    }),
  ]);

  console.log('✅ Ürünler oluşturuldu:', products.length);

  // Market ayarları
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'Benim Marketim',
      storeAddress: 'İstanbul, Türkiye',
      storePhone: '+90 555 123 4567',
      storeEmail: 'info@benimmarketim.com',
      currency: 'TL',
      theme: 'light',
      receiptFooter: 'Alışverişiniz için teşekkür ederiz!',
    },
  });

  console.log('✅ Market ayarları oluşturuldu');

  console.log('🎉 Seed tamamlandı!');
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

