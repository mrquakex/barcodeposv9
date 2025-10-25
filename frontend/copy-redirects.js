// Copy _redirects file to dist folder for Render.com
import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const source = join(__dirname, 'public', '_redirects');
const dest = join(__dirname, 'dist', '_redirects');

try {
  copyFileSync(source, dest);
  console.log('✅ _redirects file copied to dist/');
} catch (err) {
  console.error('❌ Error copying _redirects:', err.message);
  process.exit(0); // Don't fail the build
}

