import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const { PORT = '3001' } = loadEnv(mode, process.cwd(), 'PORT')

  return {
    root: fileURLToPath(new URL('./client', import.meta.url)),
    plugins: [react(), tailwindcss()],
    server: {
      host: '127.0.0.1',
      proxy: {
        '/api': `http://127.0.0.1:${PORT}`,
      },
    },
  }
})
