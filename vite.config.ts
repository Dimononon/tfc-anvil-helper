import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    watch: {
      // Exclude large build-only directories from file watcher
      ignored: [
        '**/icon_exports_tfc/**',
        '**/icon_exports_tfg/**',
        '**/TerraFirmaCraft-Forge-1.20.1-3.2.22/**',
        '**/missing-textures/**',
        '**/exported/**',
        '**/dist/**',
      ],
    },
  },
})
