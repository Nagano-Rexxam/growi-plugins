import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: ['/client-entry.tsx'],
      output: {
        entryFileNames: 'client-entry.js',
      },
    },
  },
});
