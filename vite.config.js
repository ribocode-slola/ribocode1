import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/', // Replace with your repository name
  plugins: [
    react(),
    VitePWA({
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Set limit to 5 MiB
      },
      registerType: 'autoUpdate',
      manifest: {
        name: 'React Progressive Web App',
        short_name: 'ReactApp',
        start_url: '/', // Match the base path
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist', // Output directory
    sourcemap: true, // Optional: Generate source maps
    rollupOptions: {
      input: './index.html', // Entry point
    }
  },
  server: {
    open: true, // Automatically open the browser on `npm start`
  },
})