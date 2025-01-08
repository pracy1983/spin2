import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'



// Carrega as variáveis de ambiente independente do modo

process.env = { ...process.env, ...loadEnv('', process.cwd(), '') }

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'lucide-react'
    ]
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Expõe todas as variáveis de ambiente para o cliente
  define: {
    'import.meta.env': JSON.stringify(process.env)
  }
})
