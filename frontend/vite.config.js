import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 4493,
    proxy: {
      '/api': {
        // target: 'http://extreme9i1j.creepercloud.io:26229',
        target: 'http://localhost:26229',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
