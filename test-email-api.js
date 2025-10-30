const https = require('https');

const API_KEY = 'QrYKy1UpLj2wJVBn';
const email = 'yukselquake0@gmail.com';

function sendEmail(subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      sender: {
        name: 'BarcodePOS',
        email: 'noreply@barcodepos.trade'
      },
      to: [{
        email: email,
        name: 'Mustafa'
      }],
      subject: subject,
      htmlContent: htmlContent
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': API_KEY,
        'content-type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function sendAll() {
  try {
    console.log('📧 Email\'ler gönderiliyor...\n');

    // 1. Şifre Sıfırlama
    console.log('1️⃣ Şifre sıfırlama email\'i gönderiliyor...');
    const resetUrl = `https://barcodepos.trade/reset-password?token=test-token-123456789`;
    const passwordResetHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Şifre Sıfırlama</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>Mustafa</strong>,</p>
            <p>BarcodePOS hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
            </div>
            <p style="margin-top: 20px;">Eğer buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            <p style="margin-top: 20px; color: #e74c3c;">⚠️ <strong>Önemli:</strong> Bu link 1 saat geçerlidir.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await sendEmail('🔐 BarcodePOS - Şifre Sıfırlama', passwordResetHtml);
    console.log('✅ Şifre sıfırlama email\'i gönderildi!\n');

    await new Promise(r => setTimeout(r, 2000));

    // 2. Hoş Geldin
    console.log('2️⃣ Hoş geldin email\'i gönderiliyor...');
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Hoş Geldiniz!</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>Mustafa</strong>,</p>
            <p>BarcodePOS ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p>
            <p>Artık işletmenizi yönetmek için BarcodePOS'un tüm özelliklerini kullanabilirsiniz:</p>
            <ul>
              <li>✅ Stok yönetimi</li>
              <li>✅ Satış takibi</li>
              <li>✅ Müşteri yönetimi</li>
              <li>✅ Raporlama</li>
              <li>✅ Mobil uygulama</li>
            </ul>
            <div style="text-align: center;">
              <a href="https://barcodepos.trade" class="button">Uygulamaya Git</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await sendEmail('🎉 BarcodePOS\'a Hoş Geldiniz!', welcomeHtml);
    console.log('✅ Hoş geldin email\'i gönderildi!\n');

    await new Promise(r => setTimeout(r, 2000));

    // 3. Satış Fişi
    console.log('3️⃣ Satış fişi email\'i gönderiliyor...');
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #667eea; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { background: #667eea; color: white; padding: 15px; text-align: right; font-size: 18px; border-radius: 5px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧾 Satış Fişi</h1>
            <p>Fiş No: SAT-TEST-001</p>
          </div>
          <div class="content">
            <p>Sayın <strong>Mustafa</strong>,</p>
            <p>Alışverişiniz için teşekkür ederiz!</p>
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th style="text-align: center;">Adet</th>
                  <th style="text-align: right;">Birim Fiyat</th>
                  <th style="text-align: right;">Toplam</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Test Ürün 1</td>
                  <td style="text-align: center;">2</td>
                  <td style="text-align: right;">50.00 TL</td>
                  <td style="text-align: right;"><strong>100.00 TL</strong></td>
                </tr>
                <tr>
                  <td>Test Ürün 2</td>
                  <td style="text-align: center;">1</td>
                  <td style="text-align: right;">50.00 TL</td>
                  <td style="text-align: right;"><strong>50.00 TL</strong></td>
                </tr>
              </tbody>
            </table>
            <div class="total">
              <strong>TOPLAM: 150.00 TL</strong>
            </div>
            <p style="margin-top: 20px; text-align: center; color: #666;">Tekrar görüşmek üzere!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await sendEmail('🧾 Satış Fişi - SAT-TEST-001', receiptHtml);
    console.log('✅ Satış fişi email\'i gönderildi!\n');

    console.log('🎉 Tüm email\'ler başarıyla gönderildi!');
    console.log(`📬 ${email} adresini kontrol et!`);
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

sendAll();


const API_KEY = 'QrYKy1UpLj2wJVBn';
const email = 'yukselquake0@gmail.com';

function sendEmail(subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      sender: {
        name: 'BarcodePOS',
        email: 'noreply@barcodepos.trade'
      },
      to: [{
        email: email,
        name: 'Mustafa'
      }],
      subject: subject,
      htmlContent: htmlContent
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': API_KEY,
        'content-type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function sendAll() {
  try {
    console.log('📧 Email\'ler gönderiliyor...\n');

    // 1. Şifre Sıfırlama
    console.log('1️⃣ Şifre sıfırlama email\'i gönderiliyor...');
    const resetUrl = `https://barcodepos.trade/reset-password?token=test-token-123456789`;
    const passwordResetHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Şifre Sıfırlama</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>Mustafa</strong>,</p>
            <p>BarcodePOS hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
            </div>
            <p style="margin-top: 20px;">Eğer buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            <p style="margin-top: 20px; color: #e74c3c;">⚠️ <strong>Önemli:</strong> Bu link 1 saat geçerlidir.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await sendEmail('🔐 BarcodePOS - Şifre Sıfırlama', passwordResetHtml);
    console.log('✅ Şifre sıfırlama email\'i gönderildi!\n');

    await new Promise(r => setTimeout(r, 2000));

    // 2. Hoş Geldin
    console.log('2️⃣ Hoş geldin email\'i gönderiliyor...');
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Hoş Geldiniz!</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>Mustafa</strong>,</p>
            <p>BarcodePOS ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p>
            <p>Artık işletmenizi yönetmek için BarcodePOS'un tüm özelliklerini kullanabilirsiniz:</p>
            <ul>
              <li>✅ Stok yönetimi</li>
              <li>✅ Satış takibi</li>
              <li>✅ Müşteri yönetimi</li>
              <li>✅ Raporlama</li>
              <li>✅ Mobil uygulama</li>
            </ul>
            <div style="text-align: center;">
              <a href="https://barcodepos.trade" class="button">Uygulamaya Git</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await sendEmail('🎉 BarcodePOS\'a Hoş Geldiniz!', welcomeHtml);
    console.log('✅ Hoş geldin email\'i gönderildi!\n');

    await new Promise(r => setTimeout(r, 2000));

    // 3. Satış Fişi
    console.log('3️⃣ Satış fişi email\'i gönderiliyor...');
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #667eea; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { background: #667eea; color: white; padding: 15px; text-align: right; font-size: 18px; border-radius: 5px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧾 Satış Fişi</h1>
            <p>Fiş No: SAT-TEST-001</p>
          </div>
          <div class="content">
            <p>Sayın <strong>Mustafa</strong>,</p>
            <p>Alışverişiniz için teşekkür ederiz!</p>
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th style="text-align: center;">Adet</th>
                  <th style="text-align: right;">Birim Fiyat</th>
                  <th style="text-align: right;">Toplam</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Test Ürün 1</td>
                  <td style="text-align: center;">2</td>
                  <td style="text-align: right;">50.00 TL</td>
                  <td style="text-align: right;"><strong>100.00 TL</strong></td>
                </tr>
                <tr>
                  <td>Test Ürün 2</td>
                  <td style="text-align: center;">1</td>
                  <td style="text-align: right;">50.00 TL</td>
                  <td style="text-align: right;"><strong>50.00 TL</strong></td>
                </tr>
              </tbody>
            </table>
            <div class="total">
              <strong>TOPLAM: 150.00 TL</strong>
            </div>
            <p style="margin-top: 20px; text-align: center; color: #666;">Tekrar görüşmek üzere!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await sendEmail('🧾 Satış Fişi - SAT-TEST-001', receiptHtml);
    console.log('✅ Satış fişi email\'i gönderildi!\n');

    console.log('🎉 Tüm email\'ler başarıyla gönderildi!');
    console.log(`📬 ${email} adresini kontrol et!`);
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

sendAll();

