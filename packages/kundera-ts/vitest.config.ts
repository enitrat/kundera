import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['src/**/*.test.ts', 'docs/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'types'],
  },
});
