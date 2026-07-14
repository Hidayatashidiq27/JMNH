import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Catatan: GEMINI_API_KEY sengaja TIDAK disisipkan ke bundle browser.
// Kunci hanya dipakai di sisi server (Cloudflare Function di /functions/api/scan.ts).
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
