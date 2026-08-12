import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SECURITY-FIX (W-M3): strip all console.* and debugger statements from PRODUCTION
// builds so PII / tokens / socket internals aren't shipped to end users. Kept intact in
// dev (command === 'serve') to preserve developer ergonomics.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  esbuild: {
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
}))
