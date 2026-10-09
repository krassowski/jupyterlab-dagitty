import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import jupyterPlugin from '@jupyter/eslint-plugin';

export default defineConfig([
  {
    ignores: [
      'node_modules',
      'dist',
      'coverage',
      '**/*.js',
      '**/*.d.ts',
      '.venv',
      'ui-tests'
    ]
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      jupyter: jupyterPlugin
    }
  },
  jupyterPlugin.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2015,
        ...globals.node
      },
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module'
      }
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true
          }
        }
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      curly: ['error', 'all'],
      eqeqeq: 'error',
      'prefer-arrow-callback': 'error',

      // This mimerenderer has no activate/requires, commands, tokens,
      // settings schema, server extension or i18n for these to check.
      'jupyter/plugin-activation-args': 'off',
      'jupyter/plugin-description': 'off',
      'jupyter/command-described-by': 'off',
      'jupyter/token-format': 'off',
      'jupyter/no-pageconfig-base-url': 'off',
      'jupyter/no-translation-concatenation': 'off',
      'jupyter/no-dynamic-translation': 'off',
      'jupyter/no-untranslated-string': 'off',
      'jupyter/incorrect-translator-usage': 'off',
      // Its "is this a plugin module" check requires `activate`, which this
      // never has, so it can't see the `_dagitty` import either.
      'jupyter/prefer-lazy-imports': 'off'
    }
  },
  prettierRecommended
]);
