import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure engine/game tests run in Node; UI tests opt into jsdom via a
    // `// @vitest-environment jsdom` docblock at the top of the file.
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      // The engine is the load-bearing, correctness-critical module: 100%.
      // Overall floor is >=80% per the constitution.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        'src/engine/**/*.js': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  },
});
