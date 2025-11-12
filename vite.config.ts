import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/BoozeScout-II/',   // 👈 This must match your repo name exactly
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // optional: avoid extra chunks for small projects
      },
    },
  },
  server: {
    port: 5173,               // local dev server port (change if needed)
    open: true,               // auto-open browser on npm run dev
  },
})
