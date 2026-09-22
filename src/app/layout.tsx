import type { Metadata, Viewport } from 'next';
import React from 'react';

import { Inter, JetBrains_Mono } from 'next/font/google';

import Nav from '@/components/layout/Nav';
import Loader from '@/components/common/Loader';
import GlassPointer from '@/components/common/GlassPointer';
import AmbientField from '@/components/common/AmbientField';
import BackToTop from '@/components/common/BackToTop';
import RenderMode from '@/components/common/RenderMode';
import { profile } from '@/content/profile';
import { themeInitScript } from '@/components/common/theme';

import './globals.css';

const sans = Inter({
    subsets: ['latin', 'latin-ext'],
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
            // data-theme is written by the inline script before hydration.
            suppressHydrationWarning
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
            <body className="font-sans">
                {/* The loader is dismissed by JS, so it must never appear without it. */}
                <noscript>
                    <style>{`.site-loader { display: none !important; }`}</style>
                </noscript>
                <AmbientField />
                <GlassPointer />
                <RenderMode />
                <Loader />
                <a
                    href="#work"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-small focus:text-paper"
                >
                    Skip to content
                </a>
                <Nav />
                <BackToTop />
                {children}
            </body>
        </html>
    );
}
