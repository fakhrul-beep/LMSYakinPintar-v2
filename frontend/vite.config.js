import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString('id-ID')),
    __APP_VERSION__: JSON.stringify('1.2.0-hotfix-sync')
  }
})
