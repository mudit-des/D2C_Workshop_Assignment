import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/D2C_Workshop_Assignment/',
  plugins: [tailwindcss(), react()],
})
