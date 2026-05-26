import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        bypass: function(req) {
          // DON'T proxy the Google callback - it's a frontend route
          if (req.url?.startsWith('/auth/google/callback')) {
            return req.url;
          }
        }
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});