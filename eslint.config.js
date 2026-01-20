import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', '.next', 'src/generated']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['src/features/ideas/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/works/*'],
              message: '禁止 ideas 域直接依赖 works 域；请下沉到 shared/components 或 use-cases。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/works/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/ideas/*'],
              message: '禁止 works 域直接依赖 ideas 域；请下沉到 shared/components 或 use-cases。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*'],
              message: 'components/shared 必须保持跨域可复用：禁止依赖 features/app。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/auth/**/route.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/ssr'],
              message:
                'auth route 中禁止直接使用 @supabase/ssr；请使用 src/server/supabase/route.ts 的 createSupabaseRouteClient。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
])
