module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    'build/',
    'public/',
    'supabase/',
    '*.config.*',
  ],
  rules: {
    // Vite + React 18 no longer require React in scope for JSX.
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      files: [
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/mocks/**',
        '**/tests/**',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/setup.*',
        '**/fixtures/**',
        '**/prototype/**',
        '**/prototypes/**',
        '**/temp/**',
        '**/tmp/**',
        '**/*.prototype.*',
        '**/*.tmp.*',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'prefer-const': 'off',
        'no-empty': 'off',
      },
    },
  ],
}
