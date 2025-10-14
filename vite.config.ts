import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/GestionDesStocks/',
  server: {
    host: '0.0.0.0', // Écouter sur toutes les interfaces
    port: 5173,
    strictPort: false,
  },
})
