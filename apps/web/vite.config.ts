import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// The .env file lives at the monorepo root, two levels above apps/web/.
export default defineConfig({
  plugins: [react()],
  envDir: resolve(__dirname, '../..'),
  server: {
    port: 5172,
    proxy: {
      '/api': {
        target: 'http://localhost:4100',
        changeOrigin: true
      }
    }
  }
});
