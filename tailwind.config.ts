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
            // See the type-scale note in globals.css.
            fontSize: {
                display: [
                    'var(--text-display)',
                    { lineHeight: '0.92', letterSpacing: '-0.045em' },
                ],
                title: [
                    'var(--text-title)',
                    { lineHeight: '1', letterSpacing: '-0.035em' },
                ],
                heading: [
                    'var(--text-heading)',
                    { lineHeight: '1.15', letterSpacing: '-0.022em' },
                ],
                lead: [
                    'var(--text-lead)',
                    { lineHeight: '1.5', letterSpacing: '-0.01em' },
                ],
                body: ['var(--text-body)', { lineHeight: '1.65' }],
                small: ['var(--text-small)', { lineHeight: '1.45' }],
                micro: ['var(--text-micro)', { lineHeight: '1.3' }],
            },
            maxWidth: {
                content: '68rem',
                prose: '44rem',
            },
        },
    },
    plugins: [],
} satisfies Config;
