import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// During development, requests to /api are forwarded to the FastAPI server,
// so the browser only ever talks to one address (no CORS trouble).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'node',
  },
})
