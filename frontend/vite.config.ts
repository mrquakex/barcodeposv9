import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        // Copy _redirects file to dist folder for Render.com SPA routing
        try {
          copyFileSync('public/_redirects', 'dist/_redirects');
          console.log('✅ _redirects file copied to dist/');
        } catch (err) {
          console.warn('⚠️ Could not copy _redirects file:', err);
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      format: {
        ascii_only: false,
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Hash-based filenames for cache busting
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        manualChunks: undefined,
      }
    }
  }
});
