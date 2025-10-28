// Copy public files to dist folder for Render.com
import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Files to copy
const filesToCopy = [
  { file: '_redirects', desc: '_redirects file' },
  { file: 'indir.html', desc: 'Download page' },
  { file: 'barcodeposv9.apk', desc: 'APK file' }
];

filesToCopy.forEach(({ file, desc }) => {
  const source = join(__dirname, 'public', file);
  const dest = join(__dirname, 'dist', file);
  
  try {
    copyFileSync(source, dest);
    console.log(`✅ ${desc} copied to dist/`);
  } catch (err) {
    console.error(`⚠️ Error copying ${desc}:`, err.message);
  }
});

