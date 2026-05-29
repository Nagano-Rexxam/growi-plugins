import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'client-entry.js',
      formats: ['es'],
      fileName: () => 'client-entry',
    },
  },
});

