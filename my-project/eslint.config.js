// Flat ESLint config. Enforces the constitution's layered architecture:
// dependencies point inward (ui → game → engine); engine depends on nothing
// game-specific, and game never imports ui.
import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    // The pure engine must not import the game or UI layers.
    files: ['src/engine/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/game/**', '**/ui/**'],
              message:
                'engine must not import game or ui (Constitution: dependencies point inward).',
            },
          ],
        },
      ],
    },
  },
  {
    // The game layer must not import the UI layer.
    files: ['src/game/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/ui/**'],
              message: 'game must not import ui (Constitution: dependencies point inward).',
            },
          ],
        },
      ],
    },
  },
  {
    // Browser globals for the UI layer.
    files: ['src/ui/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        requestAnimationFrame: 'readonly',
        performance: 'readonly',
      },
    },
  },
  {
    // Test globals.
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
  },
];
