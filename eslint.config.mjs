import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import justlife from 'eslint-plugin-justlife';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/generated/**',
      '**/storybook-static/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/*.config.js',
      '**/*.config.cjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // System integrity: components and patterns may only use design tokens,
    // never raw colour/size literals. This is the code-level expression of the
    // "no arbitrary values" governance rule.
    files: ['packages/ui/**/*.{ts,tsx}', 'packages/patterns/**/*.{ts,tsx}'],
    plugins: { justlife },
    rules: {
      'justlife/no-raw-values': 'error',
    },
  },
  {
    // Tests, stories, and shared SCREEN compositions: screens assemble components into full pages and
    // legitimately need placeholder/overlay raw values (green "missing artwork" blocks, white-over-media,
    // status-bar insets) that aren't design tokens — the no-raw-values rule targets reusable components.
    files: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}', '**/*.mjs', 'packages/ui/src/screens/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'justlife/no-raw-values': 'off',
    },
  },
  {
    // Node-side scripts (build/import/tools/eslint plugin): provide Node globals.
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        globalThis: 'readonly',
      },
    },
  },
);
