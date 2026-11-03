import type { Metadata, Viewport } from 'next';
import React from 'react';

import { Inter, JetBrains_Mono } from 'next/font/google';

import Nav from '@/components/layout/Nav';
import { TileSettingsProvider } from '@/components/hero/TileSettings';
import GlassPointer from '@/components/common/GlassPointer';
import SquareText from '@/components/common/SquareText';
import AmbientField from '@/components/common/AmbientField';
import BackToTop from '@/components/common/BackToTop';
import RenderMode from '@/components/common/RenderMode';
import { profile } from '@/content/profile';
import { themeInitScript } from '@/components/common/theme';

import './globals.css';

// `subsets` is only what gets preloaded. The rest stay available through
// unicode-range, so the odd "ł" still fetches latin-ext when it shows.
const sans = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const mono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

const description = `${profile.role} based in ${profile.location}. Ten years of front-end architecture, UX and end-to-end ownership.`;

/** Rendered from the real hero, so a shared link looks like the site. */
const ogImage = {
    url: '/og.jpg',
    width: 1200,
    height: 630,
    alt: `${profile.name} — ${profile.role}`,
    type: 'image/jpeg',
};

export const metadata: Metadata = {
    metadataBase: new URL('https://pawcza.codes'),
    title: {
        default: `${profile.name} · ${profile.role}`,
        template: `%s · ${profile.name}`,
    },
    description,
    keywords: [
        'front-end developer',
        'senior frontend',
        'React',
        'Next.js',
        'Vue.js',
        'TypeScript',
        'Gdynia',
        'remote',
    ],
    authors: [{ name: profile.name, url: 'https://pawcza.codes' }],
    creator: profile.name,
    openGraph: {
        type: 'website',
        locale: 'en_GB',
        url: 'https://pawcza.codes',
        siteName: 'pawcza.codes',
        title: `${profile.name} · ${profile.role}`,
        description,
        images: [ogImage],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${profile.name} · ${profile.role}`,
        description,
        images: [ogImage.url],
    },
    alternates: {
        canonical: 'https://pawcza.codes',
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f4f4f1' },
        { media: '(prefers-color-scheme: dark)', color: '#0c0c0f' },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${sans.variable} ${mono.variable}`}
            // data-theme is written by the inline script
            // before hydration.
            suppressHydrationWarning
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
                {/* Umami, proxied first-party under /stats by NPM. */}
                {process.env.NODE_ENV === 'production' && (
                    <script
                        defer
                        src="/stats/script.js"
                        data-website-id="fab089be-a7e8-482c-9fae-04a5eca89fe7"
                    />
                )}
            </head>
            <body className="font-sans">
                <AmbientField />
                <GlassPointer />
                <SquareText />
                <RenderMode />
                <a
                    href="#work"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-small focus:text-paper"
                >
                    Skip to content
                </a>
                {/* Above the nav as well as the page: the nav opens settings. */}
                <TileSettingsProvider>
                    <Nav />
                    <BackToTop />
                    {children}
                </TileSettingsProvider>
            </body>
        </html>
    );
}
