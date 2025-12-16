import nextConfig from 'eslint-config-next';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

const config = [
    {
        ignores: ['src/types/component-types-sb.d.ts'],
    },
    ...nextConfig,
    {
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            'react-hooks': reactHooks,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/static-components': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'import/no-anonymous-default-export': 'off',
        },
    },
];

export default config;

