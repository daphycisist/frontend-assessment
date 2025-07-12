import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { join } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: process.env.ANALYZE ? [visualizer({ filename: 'bundle-stats.html' })] : [],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: join(__dirname, 'vitest.setup.ts'),
    css: false,
  },
});
