/**
 * Vite configuration file for Ribocode project.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner.gamil.com>
 */
import 'dotenv/config';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

console.log('VITE_BASE_PATH:', process.env.VITE_BASE_PATH);

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/', //'/ribocode1/', // Replace with your repository name
  plugins: [
    react(),
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