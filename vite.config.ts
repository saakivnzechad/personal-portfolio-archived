import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  assetsInclude: ['/src/pages/**/*.html', '/src/layouts/**/*.html'],
  build: {
    assetsInlineLimit: 0,
  },
})