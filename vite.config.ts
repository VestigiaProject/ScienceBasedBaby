import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      external: [
        'firebase-admin/app',
        'firebase-admin/firestore',
        'firebase-admin/auth'
      ]
    }
  },
  assetsInclude: ['**/*.png'] // Ensure PNG files are handled as assets
});