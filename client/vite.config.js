import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Note: This plugin might not be standard, usually Tailwind is added as a PostCSS plugin

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
