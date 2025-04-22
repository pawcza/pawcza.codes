import type { Metadata } from 'next';
import React from 'react';

import { ISbStoriesParams, StoryblokClient } from '@storyblok/react';
import { Montserrat } from 'next/font/google';
import { ViewTransitions } from 'next-view-transitions';

import { getStoryblokApi } from '@/lib/storyblok';

import Tiles from '@/components/layout/Tiles';
import Navigation from '@/components/layout/Navigation';
import StoryblokProvider from '@/components/context/StoryblokProvider';

import './globals.css';

const montserrat = Montserrat({
    subsets: ['latin'],
    weight: 'variable',
});

export const metadata: Metadata = {
    title: 'pawcza.codes',
    description: 'A passionate front-end developer.',
};

const fetchNavigationData = async () => {
    const sbParams: ISbStoriesParams = {
        version: 'draft',
        resolve_relations: 'navigation.items',
    };
    const storyblokApi: StoryblokClient = getStoryblokApi();

    const { data } = await storyblokApi.get('cdn/stories/navigation', sbParams);
    return data.story.content.items;
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const menuItems = await fetchNavigationData();

    return (
        <StoryblokProvider>
            <ViewTransitions>
                <html lang="en">
                    <body className={`${montserrat.className} antialiased`}>
                        <Navigation items={menuItems} />
                        <Tiles>{children}</Tiles>
                    </body>
                </html>
            </ViewTransitions>
        </StoryblokProvider>
    );
}
