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
  build: {
    // Optimisations de build pour améliorer les performances
    rollupOptions: {
      output: {
        // Code splitting manuel pour de meilleurs chunks
        manualChunks: {
          // Séparer React et ReactDOM
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Séparer Supabase
          'supabase': ['@supabase/supabase-js'],
          // Séparer les utilitaires lourds
          'heavy-libs': ['html2canvas', 'jspdf', 'xlsx'],
        },
      },
    },
    // Augmenter la limite de warning (temporaire)
    chunkSizeWarningLimit: 1000,
    // Minification par défaut (esbuild est plus rapide que terser)
    minify: 'esbuild',
  },
})
