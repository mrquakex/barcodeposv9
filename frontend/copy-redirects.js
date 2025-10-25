// Copy _redirects file to dist folder for Render.com
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'public', '_redirects');
const dest = path.join(__dirname, 'dist', '_redirects');

try {
  fs.copyFileSync(source, dest);
  console.log('✅ _redirects file copied to dist/');
} catch (err) {
  console.error('❌ Error copying _redirects:', err.message);
  process.exit(0); // Don't fail the build
}

