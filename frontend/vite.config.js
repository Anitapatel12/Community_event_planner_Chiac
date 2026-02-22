import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, '')
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://localhost:5001'

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port: 3000,
      strictPort: false,
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
