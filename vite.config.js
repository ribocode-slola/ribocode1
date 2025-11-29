import 'dotenv/config';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

console.log('VITE_BASE_PATH:', process.env.VITE_BASE_PATH);

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/', //'/ribocode1/', // Replace with your repository name
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
        start_url: process.env.VITE_BASE_PATH || '/', //'/ribocode1/', // Update this to match your GitHub Pages base path
        scope: process.env.VITE_BASE_PATH || '/', //'/ribocode1/', // Ensure this matches the base path
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
  resolve: {
    alias: {
      'molstar': path.resolve(__dirname, 'packages/molstar'),
    },
  },
})