import nodemailer from 'nodemailer';

// Brevo SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Microsoft Fluent Design Email Base Template
const getFluentEmailTemplate = (title: string, content: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #F3F2F1;
          padding: 40px 20px;
          line-height: 1.6;
          color: #323130;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #FFFFFF;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 0.3px 0.9px 0 rgba(0,0,0,.108);
        }
        .header {
          background: linear-gradient(135deg, #0078D4 0%, #106EBE 100%);
          padding: 40px 32px;
          text-align: left;
        }
        .header h1 {
          color: #FFFFFF;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 32px;
        }
        .content p {
          color: #323130;
          font-size: 15px;
          margin-bottom: 16px;
          line-height: 1.6;
        }
        .content strong {
          color: #201F1E;
          font-weight: 600;
        }
        .button-container {
          margin: 32px 0;
          text-align: center;
        }
        .button {
          display: inline-block;
          padding: 12px 32px;
          background: #0078D4;
          color: #FFFFFF !important;
          text-decoration: none;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 0.3px 0.9px 0 rgba(0,0,0,.108);
        }
        .button:hover {
          background: #106EBE;
          box-shadow: 0 3.2px 7.2px 0 rgba(0,0,0,.132), 0 0.6px 1.8px 0 rgba(0,0,0,.108);
        }
        .info-box {
          background: #F3F2F1;
          border-left: 4px solid #0078D4;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 0;
          font-size: 14px;
          color: #605E5C;
        }
        .link-box {
          background: #FAF9F8;
          border: 1px solid #EDEBE9;
          padding: 16px;
          border-radius: 4px;
          margin: 16px 0;
          word-break: break-all;
        }
        .link-box a {
          color: #0078D4;
          font-size: 13px;
          text-decoration: none;
        }
        .warning {
          background: #FFF4CE;
          border-left: 4px solid #FFB900;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
        }
        .warning p {
          margin: 0;
          font-size: 14px;
          color: #323130;
        }
        .footer {
          background: #FAF9F8;
          padding: 24px 32px;
          text-align: center;
          border-top: 1px solid #EDEBE9;
        }
        .footer p {
          color: #605E5C;
          font-size: 13px;
          margin: 8px 0;
        }
        .logo {
          width: 32px;
          height: 32px;
          background: #FFFFFF;
          border-radius: 4px;
          display: inline-block;
          padding: 6px;
          margin-bottom: 12px;
        }
        hr {
          border: none;
          border-top: 1px solid #EDEBE9;
          margin: 24px 0;
        }
        @media only screen and (max-width: 600px) {
          .content { padding: 24px 20px; }
          .header { padding: 32px 20px; }
          .header h1 { font-size: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        ${content}
      </div>
    </body>
    </html>
  `;
};

/**
 * Send email using Brevo SMTP
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      from: '"BarcodePOS" <info@barcodepos.trade>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
    });

    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Email gönderilemedi');
  }
};

/**
 * Send password reset email (Fluent Design)
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<void> => {
  const resetUrl = `https://barcodepos.trade/reset-password?token=${resetToken}`;

  const content = `
    <div class="header">
      <h1>🔐 Şifre Sıfırlama</h1>
    </div>
    <div class="content">
      <p>Merhaba <strong>${userName}</strong>,</p>
      <p>BarcodePOS hesabınız için şifre sıfırlama talebinde bulundunuz. Güvenliğiniz bizim için önemli.</p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
      </div>

      <div class="info-box">
        <p><strong>Alternatif yöntem:</strong> Eğer yukarıdaki buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
      </div>

      <div class="link-box">
        <a href="${resetUrl}">${resetUrl}</a>
      </div>

      <div class="warning">
        <p><strong>⚠️ Güvenlik Uyarısı:</strong> Bu link 1 saat geçerlidir. Eğer siz bu talebi yapmadıysanız, hesabınızın güvenliği için şifrenizi değiştirmenizi öneririz.</p>
      </div>

      <hr>

      <p style="font-size: 14px; color: #605E5C;">
        Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
      </p>
    </div>
    <div class="footer">
      <p><strong>BarcodePOS</strong></p>
      <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
      <p style="margin-top: 12px;">İşletme Yönetim Sistemi</p>
    </div>
  `;

  const html = getFluentEmailTemplate('Şifre Sıfırlama', content);

  await sendEmail({
    to: email,
    subject: '🔐 BarcodePOS - Şifre Sıfırlama Talebi',
    html,
  });
};

/**
 * Send welcome email (Fluent Design)
 */
export const sendWelcomeEmail = async (
  email: string,
  userName: string
): Promise<void> => {
  const content = `
    <div class="header">
      <h1>👋 Hoş Geldiniz!</h1>
    </div>
    <div class="content">
      <p>Merhaba <strong>${userName}</strong>,</p>
      <p>BarcodePOS ailesine katıldığınız için teşekkür ederiz. Hesabınız başarıyla oluşturuldu ve artık tüm özelliklerimizden faydalanabilirsiniz.</p>

      <div class="info-box">
        <p><strong>Size Sunduğumuz Özellikler:</strong></p>
      </div>

      <p style="margin-left: 16px;">
        ✓ <strong>Gelişmiş Stok Yönetimi</strong> - ABC analizi, stok uyarıları<br>
        ✓ <strong>Hızlı POS Sistemi</strong> - Barkod okuma, offline satış<br>
        ✓ <strong>Müşteri Yönetimi</strong> - Borç takibi, satış geçmişi<br>
        ✓ <strong>Detaylı Raporlama</strong> - Anlık raporlar, grafikler<br>
        ✓ <strong>Mobil Uygulama</strong> - Her yerden erişim
      </p>

      <div class="button-container">
        <a href="https://barcodepos.trade" class="button">Uygulamayı Kullanmaya Başla</a>
      </div>

      <hr>

      <p style="font-size: 14px; color: #605E5C;">
        Herhangi bir sorunuz olursa, destek ekibimiz size yardımcı olmaktan mutluluk duyacaktır.
      </p>
    </div>
    <div class="footer">
      <p><strong>BarcodePOS</strong></p>
      <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
      <p style="margin-top: 12px;">İşletme Yönetim Sistemi</p>
    </div>
  `;

  const html = getFluentEmailTemplate('Hoş Geldiniz', content);

  await sendEmail({
    to: email,
    subject: '👋 BarcodePOS\'a Hoş Geldiniz!',
    html,
  });
};

/**
 * Send sale receipt email (Fluent Design)
 */
export const sendSaleReceiptEmail = async (
  email: string,
  customerName: string,
  saleNumber: string,
  total: number,
  items: Array<{ name: string; quantity: number; price: number }>
): Promise<void> => {
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #EDEBE9; color: #323130;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #EDEBE9; text-align: center; color: #323130;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #EDEBE9; text-align: right; color: #323130;">${item.price.toFixed(2)} ₺</td>
          <td style="padding: 12px; border-bottom: 1px solid #EDEBE9; text-align: right; color: #201F1E; font-weight: 600;">${(item.quantity * item.price).toFixed(2)} ₺</td>
        </tr>
      `
    )
    .join('');

  const content = `
    <div class="header">
      <h1>🧾 Satış Fişi</h1>
    </div>
    <div class="content">
      <p>Sayın <strong>${customerName}</strong>,</p>
      <p>Alışverişiniz için teşekkür ederiz. İşlem detaylarınız aşağıda yer almaktadır.</p>

      <div class="info-box">
        <p><strong>Fiş Numarası:</strong> ${saleNumber}<br>
        <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #FFFFFF;">
        <thead>
          <tr style="background: #F3F2F1;">
            <th style="padding: 12px; text-align: left; color: #323130; font-weight: 600; border-bottom: 2px solid #0078D4;">Ürün</th>
            <th style="padding: 12px; text-align: center; color: #323130; font-weight: 600; border-bottom: 2px solid #0078D4;">Adet</th>
            <th style="padding: 12px; text-align: right; color: #323130; font-weight: 600; border-bottom: 2px solid #0078D4;">Birim Fiyat</th>
            <th style="padding: 12px; text-align: right; color: #323130; font-weight: 600; border-bottom: 2px solid #0078D4;">Toplam</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="background: #0078D4; color: #FFFFFF; padding: 20px; border-radius: 4px; text-align: right; margin-top: 16px;">
        <p style="margin: 0; font-size: 18px; font-weight: 600;">TOPLAM: ${total.toFixed(2)} ₺</p>
      </div>

      <hr>

      <p style="text-align: center; color: #605E5C; font-size: 14px;">
        Tekrar görüşmek üzere!
      </p>
    </div>
    <div class="footer">
      <p><strong>BarcodePOS</strong></p>
      <p>&copy; 2025 BarcodePOS. Tüm hakları saklıdır.</p>
      <p style="margin-top: 12px;">İşletme Yönetim Sistemi</p>
    </div>
  `;

  const html = getFluentEmailTemplate('Satış Fişi', content);

  await sendEmail({
    to: email,
    subject: `🧾 Satış Fişi - ${saleNumber}`,
    html,
  });
};
