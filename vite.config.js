import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Karobaar',
        short_name: 'Karobaar',
        description: 'Karobaar Business Command Center',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone'
      }
    })
  ],
  base: './'
})
