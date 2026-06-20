import { defineConfig } from 'vitest/config';

// Standalone config so tests resolve from the package root rather than the
// Vite renderer root (which is scoped to src/renderer for the app build).
export default defineConfig({
  test: {
    root: __dirname,
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'node',
  },
});
