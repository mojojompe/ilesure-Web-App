import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SECURITY-FIX (W-M3): strip all console.* and debugger statements from PRODUCTION
// builds so PII / tokens / socket internals aren't shipped to end users. Kept intact in
// dev (command === 'serve') to preserve developer ergonomics.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // PERF-FIX (QA-PERF-001): this app shipped as ONE monolithic JS chunk, so every
        // user downloaded and parsed the entire application — every role's screens —
        // before first render. Split vendors out, mirroring ilesure-home, which already
        // does this correctly.
        // PERF-FIX (QA-PERF-001): only LEAF packages are split out. Splitting react
        // itself created a `vendor -> vendor-react -> vendor` cycle, because other
        // vendor code imports react — Rollup warns and chunk load order gets fragile.
        // Icon packs must be matched before anything containing "react", since they
        // live at @hugeicons/react and react-icons.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('lucide-react') || id.includes('@hugeicons') || id.includes('react-icons')) return 'vendor-icons';
          if (id.includes('framer-motion') || id.includes('gsap')) return 'vendor-animation';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('antd') || id.includes('@ant-design') || id.includes('rc-')) return 'vendor-antd';
          return 'vendor';
        }
      }
    }
  },

  esbuild: {
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
}))
