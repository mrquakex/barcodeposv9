import { sendPasswordResetEmail, sendWelcomeEmail, sendSaleReceiptEmail } from './backend/src/services/email.service';

const emails = ['mrquakex3@gmail.com', 'yukselquake0@gmail.com'];

async function testFluentEmails() {
  try {
    console.log('📧 Fluent Design Email\'leri gönderiliyor...\n');

    // 1. Şifre Sıfırlama
    console.log('1️⃣ Şifre sıfırlama email\'leri gönderiliyor...');
    for (const email of emails) {
      await sendPasswordResetEmail(email, 'test-token-fluent-123', 'Mustafa');
      console.log(`   ✅ ${email}`);
    }
    console.log('');

    await new Promise(r => setTimeout(r, 2000));

    // 2. Hoş Geldin
    console.log('2️⃣ Hoş geldin email\'leri gönderiliyor...');
    for (const email of emails) {
      await sendWelcomeEmail(email, 'Mustafa');
      console.log(`   ✅ ${email}`);
    }
    console.log('');

    await new Promise(r => setTimeout(r, 2000));

    // 3. Satış Fişi
    console.log('3️⃣ Satış fişi email\'leri gönderiliyor...');
    for (const email of emails) {
      await sendSaleReceiptEmail(
        email,
        'Mustafa',
        'SAT-FLUENT-001',
        299.90,
        [
          { name: 'Microsoft Surface Pro', quantity: 1, price: 199.90 },
          { name: 'Surface Pen', quantity: 1, price: 100.00 },
        ]
      );
      console.log(`   ✅ ${email}`);
    }
    console.log('');

    console.log('🎉 Tüm Fluent Design email\'ler başarıyla gönderildi!');
    console.log('📬 Email adreslerini kontrol et!');
    console.log('\n🎨 Yeni tasarım özellikleri:');
    console.log('   ✓ Microsoft Fluent Design');
    console.log('   ✓ Profesyonel mavi renk paleti');
    console.log('   ✓ Soft shadows & depth');
    console.log('   ✓ Segoe UI font');
    console.log('   ✓ info@barcodepos.trade sender');
  } catch (error: any) {
    console.error('❌ Hata:', error.message);
  }
}

testFluentEmails();


const emails = ['mrquakex3@gmail.com', 'yukselquake0@gmail.com'];

async function testFluentEmails() {
  try {
    console.log('📧 Fluent Design Email\'leri gönderiliyor...\n');

    // 1. Şifre Sıfırlama
    console.log('1️⃣ Şifre sıfırlama email\'leri gönderiliyor...');
    for (const email of emails) {
      await sendPasswordResetEmail(email, 'test-token-fluent-123', 'Mustafa');
      console.log(`   ✅ ${email}`);
    }
    console.log('');

    await new Promise(r => setTimeout(r, 2000));

    // 2. Hoş Geldin
    console.log('2️⃣ Hoş geldin email\'leri gönderiliyor...');
    for (const email of emails) {
      await sendWelcomeEmail(email, 'Mustafa');
      console.log(`   ✅ ${email}`);
    }
    console.log('');

    await new Promise(r => setTimeout(r, 2000));

    // 3. Satış Fişi
    console.log('3️⃣ Satış fişi email\'leri gönderiliyor...');
    for (const email of emails) {
      await sendSaleReceiptEmail(
        email,
        'Mustafa',
        'SAT-FLUENT-001',
        299.90,
        [
          { name: 'Microsoft Surface Pro', quantity: 1, price: 199.90 },
          { name: 'Surface Pen', quantity: 1, price: 100.00 },
        ]
      );
      console.log(`   ✅ ${email}`);
    }
    console.log('');

    console.log('🎉 Tüm Fluent Design email\'ler başarıyla gönderildi!');
    console.log('📬 Email adreslerini kontrol et!');
    console.log('\n🎨 Yeni tasarım özellikleri:');
    console.log('   ✓ Microsoft Fluent Design');
    console.log('   ✓ Profesyonel mavi renk paleti');
    console.log('   ✓ Soft shadows & depth');
    console.log('   ✓ Segoe UI font');
    console.log('   ✓ info@barcodepos.trade sender');
  } catch (error: any) {
    console.error('❌ Hata:', error.message);
  }
}

testFluentEmails();

