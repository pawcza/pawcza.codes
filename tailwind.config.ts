import type { Config } from 'tailwindcss';

export default {
    content: [
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                paper: 'var(--paper)',
                'paper-raised': 'var(--paper-raised)',
                ink: 'var(--ink)',
                'ink-muted': 'var(--ink-muted)',
                'ink-faint': 'var(--ink-faint)',
                line: 'var(--line)',
                'line-strong': 'var(--line-strong)',
                accent: 'var(--accent)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
                mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
            },
            maxWidth: {
                content: '68rem',
                prose: '44rem',
            },
        },
    },
    plugins: [],
} satisfies Config;
