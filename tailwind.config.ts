import type { Config } from 'tailwindcss';

export default {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                'theme-gold': 'var(--theme-gold)',
                'theme-green': 'var(--theme-green)',
                'theme-blue': 'var(--theme-blue)',
            },
            container: {
                screens: {
                    lg: '768px',
                    xl: '1024px',
                },
            },
        },
    },
    plugins: [],
    safelist: [
        'justify-start',
        'justify-center',
        'justify-end',
        'justify-around',
        'justify-evenly',
        'justify-between',
        'items-start',
        'items-center',
        'items-end',
        'bg-theme-gold',
        'bg-theme-blue',
        'bg-theme-green',
    ],
} satisfies Config;
