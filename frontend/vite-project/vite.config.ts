import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

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
    terserOptions: ( {
      compress: {
        passes: 2,
        drop_console: true,
        drop_debugger: true,
      },
      mangle: true,
      format: {
        comments: false,
      },
    } as any ),
    // split large dependencies into logical chunks to improve caching and parse time
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return null;
          if (id.includes('node_modules')) {
            // Keep React and React-DOM together (they're tightly coupled)
            if (id.includes('react')) return 'vendor.react';
            // jspdf in its own chunk (lazy-loaded)
            if (id.includes('jspdf')) return 'vendor.jspdf';
            // Other vendors
            if (id.includes('socket.io-client')) return 'vendor.socketio';
            if (id.includes('react-select')) return 'vendor.select';
            if (id.includes('styled-components')) return 'vendor.styled';
            return 'vendor';
          }
        }
      }
    },
    // disable sourcemaps in production to reduce size
    sourcemap: false,
  }
})
