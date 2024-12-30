import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5080,
    strictPort: true,
    host: '0.0.0.0', // Listen on all interfaces
    proxy: {
      '/auth': {
        target: 'http://localhost:5181',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:5181',
        changeOrigin: true,
        secure: false
      },
      '/tickets': {
        target: 'http://localhost:5181',
        changeOrigin: true,
        secure: false
      },
      '/hotels': {
        target: 'http://localhost:5181',
        changeOrigin: true,
        secure: false
      },
      '/contacts': {
        target: 'http://localhost:5181',
        changeOrigin: true,
        secure: false
      },
      '/guests': {
        target: 'http://localhost:5181',
        changeOrigin: true,
        secure: false
      },
      '/bookings': {
        target: 'http://localhost:5181',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000
  }
});
