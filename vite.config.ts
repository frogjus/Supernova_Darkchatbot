import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/Supernova_Darkchatbot/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'SUPERNOVA DARKMODE',
        short_name: 'SUPERNOVA',
        description: 'Talk to broken idols. Help them heal.',
        theme_color: '#FFF0F5',
        background_color: '#FFF0F5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/Supernova_Darkchatbot/',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
