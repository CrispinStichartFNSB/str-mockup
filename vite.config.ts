import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves project sites from /<repository-name>/.
  base: '/str-mockup/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        application: fileURLToPath(new URL('./index.html', import.meta.url)),
        unitSelectionLab: fileURLToPath(new URL('./unit-selection.html', import.meta.url)),
        addressUnitSelectionLab: fileURLToPath(
          new URL('./address-unit-selection.html', import.meta.url),
        ),
      },
    },
  },
})
