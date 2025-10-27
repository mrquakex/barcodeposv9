#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Renk kodları
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// İngilizce metin bulma regex pattern'leri
const patterns = [
  // HTML içinde: >Text<
  { 
    regex: />((?:[A-Z][a-z]{2,}(?:\s+[A-Z]?[a-z]+)*|[A-Z]{2,}))</g,
    type: 'HTML Content',
    color: colors.red
  },
  // label="Text"
  { 
    regex: /label=["']([A-Z][a-z]{2,}[^"']*)["']/g,
    type: 'Label Prop',
    color: colors.yellow
  },
  // placeholder="Text"
  { 
    regex: /placeholder=["']([A-Z][a-z]{2,}[^"']*)["']/g,
    type: 'Placeholder Prop',
    color: colors.cyan
  },
  // title="Text"
  { 
    regex: /title=["']([A-Z][a-z]{2,}[^"']*)["']/g,
    type: 'Title Prop',
    color: colors.magenta
  },
  // String literal içinde (örn: "Loading..." veya 'No data')
  { 
    regex: /["']([A-Z][a-z]{2,}(?:\s+[a-z]+)*\.{0,3})["']/g,
    type: 'String Literal',
    color: colors.blue
  }
];

// Hariç tutulacak kelimeler (değişken adları, import'lar vs.)
const excludeWords = [
  'React', 'useState', 'useEffect', 'useTranslation', 'Router', 'Route',
  'FluentButton', 'FluentCard', 'FluentInput', 'FluentDialog', 'FluentBadge',
  'Request', 'Response', 'Express', 'Prisma', 'Date', 'String', 'Number',
  'Boolean', 'Array', 'Object', 'Promise', 'Function', 'Error', 'Map', 'Set',
  'div', 'span', 'button', 'input', 'form', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'className', 'onClick', 'onChange', 'onSubmit', 'value', 'name', 'type',
  'import', 'export', 'default', 'const', 'let', 'var', 'function', 'return',
  'Interface', 'Type', 'Enum', 'Class', 'Component', 'Props', 'State',
  'AxiosError', 'TypeError', 'ReferenceError', 'SyntaxError',
  'Admin', 'Manager', 'Cashier', 'ADMIN', 'MANAGER', 'CASHIER', // Rol isimleri
  'CASH', 'CARD', 'CREDIT', 'COMPLETED', 'PENDING', 'VOIDED', // Enum değerleri
  'IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'ALL', // Stok hareket tipleri (zaten çevrildi)
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH', // HTTP metodları
];

// Dizin tarama
function scanDirectory(dir, results = {}) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // node_modules, .git gibi klasörleri atla
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        scanDirectory(filePath, results);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = findEnglishText(content, filePath);
      
      if (matches.length > 0) {
        results[filePath] = matches;
      }
    }
  });
  
  return results;
}

// İngilizce metin bulma
function findEnglishText(content, filePath) {
  const matches = [];
  const lines = content.split('\n');
  
  patterns.forEach(({ regex, type, color }) => {
    let match;
    const usedRegex = new RegExp(regex.source, regex.flags);
    
    while ((match = usedRegex.exec(content)) !== null) {
      const text = match[1];
      
      // Hariç tutulacak kelimeleri kontrol et
      if (excludeWords.some(word => text.includes(word))) {
        continue;
      }
      
      // t('...') veya {t(...)} içinde mi kontrol et
      const beforeMatch = content.substring(Math.max(0, match.index - 10), match.index);
      if (beforeMatch.includes('t(') || beforeMatch.includes('{t(')) {
        continue;
      }
      
      // Satır numarasını bul
      const beforeText = content.substring(0, match.index);
      const lineNumber = beforeText.split('\n').length;
      
      matches.push({
        text,
        type,
        color,
        line: lineNumber,
        context: lines[lineNumber - 1]?.trim() || ''
      });
    }
  });
  
  return matches;
}

// Sonuçları raporla
function printReport(results) {
  const totalFiles = Object.keys(results).length;
  let totalMatches = 0;
  
  console.log(`\n${colors.green}╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  🔍 İNGİLİZCE METİN TESPİT RAPORU                        ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  if (totalFiles === 0) {
    console.log(`${colors.green}✅ TEBRİKLER! Hiç İngilizce metin bulunamadı!${colors.reset}\n`);
    return;
  }
  
  Object.entries(results).forEach(([filePath, matches]) => {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`\n${colors.cyan}📄 ${relativePath}${colors.reset}`);
    console.log(`${colors.yellow}   (${matches.length} İngilizce metin bulundu)${colors.reset}\n`);
    
    matches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.color}[${match.type}]${colors.reset}`);
      console.log(`      Satır ${match.line}: "${colors.red}${match.text}${colors.reset}"`);
      console.log(`      ${colors.blue}Bağlam:${colors.reset} ${match.context.substring(0, 80)}...`);
      console.log('');
      totalMatches++;
    });
  });
  
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════════════════════`);
  console.log(`  📊 ÖZET`);
  console.log(`═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ${colors.red}❌ Toplam Dosya: ${totalFiles}${colors.reset}`);
  console.log(`  ${colors.red}❌ Toplam İngilizce Metin: ${totalMatches}${colors.reset}`);
  console.log(`\n${colors.yellow}  💡 TİP: Tüm metinleri düzeltmek için:${colors.reset}`);
  console.log(`     npm run translate-all\n`);
}

// Ana fonksiyon
function main() {
  const targetDir = path.join(__dirname, '../frontend/src/pages');
  
  console.log(`${colors.cyan}🔍 Tarama başlatılıyor: ${targetDir}${colors.reset}\n`);
  
  const results = scanDirectory(targetDir);
  printReport(results);
}

// Scripti çalıştır
if (require.main === module) {
  main();
}

module.exports = { scanDirectory, findEnglishText };




