import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createApiBaseUrlDefine } from './scripts/create-api-base-url-define.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = {
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  }

  return {
    define: createApiBaseUrlDefine(environment),
    plugins: [
      react(),
      tailwindcss(),
    ],
    // pdf.js is loaded on demand (booklet PDF export). Pre-bundling it at startup stops the dev
    // server from re-optimizing mid-session, which breaks already-open lazily loaded pages.
    optimizeDeps: {
      include: ['pdfjs-dist/legacy/build/pdf.mjs'],
    },
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': 'http://127.0.0.1:8080',
      },
    },
    test: {
      testTimeout: 15000,
    },
  }
})
