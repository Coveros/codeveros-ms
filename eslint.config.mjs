import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommendedTypeChecked, prettierConfig, {
  languageOptions: {
    parserOptions: {
      project: './tsconfig.eslint.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    'no-prototype-builtins': 'off',
  },
});
