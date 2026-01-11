import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    open: true
  },
  test: {
    exclude: ['**/e2e/**', '**/node_modules/**']
  }
})
