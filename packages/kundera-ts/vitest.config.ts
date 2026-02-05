import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'docs/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'types'],
  },
});
