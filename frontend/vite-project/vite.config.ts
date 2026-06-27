import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
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
    tailwindcss(),
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
    // disable sourcemaps in production to reduce size
    sourcemap: false,
  }
})
