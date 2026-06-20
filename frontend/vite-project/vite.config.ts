import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import type { MinifyOptions } from 'terser'

const terserOptions: MinifyOptions = {
  compress: {
    passes: 2,
    drop_console: true,
    drop_debugger: true,
  },
  mangle: true,
  format: {
    comments: false,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Generate bundle visualization (dist/stats.html)
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    target: 'es2018',
    chunkSizeWarningLimit: 1024,
    // Use terser for best minification size (slower than esbuild)
    minify: 'terser',
    terserOptions,
    // split large dependencies into logical chunks to improve caching and parse time
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return null;
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor.react';
            }
            if (id.includes('/styled-components/') || id.includes('/stylis/')) return 'vendor.styled';
            if (id.includes('/react-select/') || id.includes('/@emotion/')) return 'vendor.select';
            if (id.includes('/socket.io-client/') || id.includes('/engine.io-client/')) return 'vendor.socket';
            if (id.includes('/jspdf') || id.includes('/jspdf-autotable/') || id.includes('/qrcode/')) {
              return 'vendor.pdf';
            }
            return 'vendor';
          }
        }
      }
    },
    // disable sourcemaps in production to reduce size
    sourcemap: false,
  }
})
