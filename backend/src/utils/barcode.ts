/**
 * EAN-13 barkod üretici
 * 12 haneli sayıdan 13. haneyi (check digit) hesaplar
 */
export function generateEAN13(): string {
  // İlk 12 haneyi rastgele oluştur
  let barcode = '869'; // Türkiye ön eki
  
  for (let i = 0; i < 9; i++) {
    barcode += Math.floor(Math.random() * 10);
  }
  
  // Check digit hesapla
  const checkDigit = calculateEAN13CheckDigit(barcode);
  return barcode + checkDigit;
}

/**
 * EAN-13 check digit hesaplama
 */
export function calculateEAN13CheckDigit(barcode12: string): number {
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode12[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit;
}

/**
 * EAN-13 barkod doğrulama
 */
export function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13) return false;
  
  const barcode12 = barcode.slice(0, 12);
  const checkDigit = parseInt(barcode[12]);
  
  return calculateEAN13CheckDigit(barcode12) === checkDigit;
}

