import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  main: {
    // No externalizeDepsPlugin here so local CJS modules (registryBackend,
    // codecSchemaCjs) get bundled into out/main/index.js.
    build: {
      rollupOptions: {
        input: { index: resolve('src/main/index.js') },
        output: { format: 'cjs' }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
