import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    /* Proxy API and WS calls to the Express/y-websocket backend */
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand', 'lucide-react', 'react-router-dom'],
          three: ['three'],
          yjs: ['yjs', 'y-websocket'],
          konva: ['react-konva', 'konva']
        }
      }
    }
  }
});
