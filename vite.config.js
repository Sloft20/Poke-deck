import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Meu Deck Pokémon',
        short_name: 'PokeDeck',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/vite.svg', // Mais tarde você troca pelo ícone de uma pokebola!
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})