import crypto from 'crypto';

/**
 * Encryption Service - AES-256 GCM şifreleme
 */
class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // Ortam değişkeninden key al, yoksa güvenli bir şekilde oluştur
    const keyString = process.env.ENCRYPTION_KEY || this.generateKey();
    this.key = Buffer.from(keyString, 'hex');
  }

  /**
   * Güvenli key oluştur (32 byte = 256 bit)
   */
  private generateKey(): string {
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  ENCRYPTION_KEY not found. Generated new key. Add to .env:');
    console.warn(`ENCRYPTION_KEY=${key}`);
    return key;
  }

  /**
   * Veriyi şifrele
   */
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    try {
      // Rastgele IV (Initialization Vector) oluştur
      const iv = crypto.randomBytes(16);
      
      // Cipher oluştur
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      // Şifreleme
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Auth tag al (GCM için)
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Şifreyi çöz
   */
  decrypt(encrypted: string, iv: string, tag: string): string {
    try {
      // Decipher oluştur
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );
      
      // Auth tag ayarla
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      // Şifre çözme
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash oluştur (SHA-256)
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Güvenli rastgele token oluştur
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Email'i anonimleştir (GDPR için)
   */
  anonymizeEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const visibleChars = Math.min(2, Math.floor(localPart.length / 3));
    const masked = localPart.slice(0, visibleChars) + '*'.repeat(localPart.length - visibleChars);
    return `${masked}@${domain}`;
  }

  /**
   * Telefonu anonimleştir
   */
  anonymizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return '****';
    return digits.slice(0, -4).replace(/./g, '*') + digits.slice(-4);
  }

  /**
   * İsmi anonimleştir
   */
  anonymizeName(name: string): string {
    const parts = name.split(' ');
    return parts
      .map(part => {
        if (part.length <= 2) return part;
        return part.charAt(0) + '*'.repeat(part.length - 1);
      })
      .join(' ');
  }

  /**
   * Kart numarasını maskele
   */
  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 8) return '****';
    return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  }
}

export const encryptionService = new EncryptionService();

