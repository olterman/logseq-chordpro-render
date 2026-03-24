import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['iife'],
      name: 'LogseqChordproRender',
      fileName: () => 'index.js',
    },
  },
})
