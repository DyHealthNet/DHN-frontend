import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
// TODO remove server host and add comment to add users own host/ allowed hosts
export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    host: '0.0.0.0',
    port: 8003,
    allowedHosts: [
      'gnext.gm.eurac.edu',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
