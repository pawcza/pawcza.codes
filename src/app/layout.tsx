import type { Metadata } from 'next';
import React from 'react';

import { ISbStoriesParams, StoryblokClient } from '@storyblok/react';
import { Ubuntu_Mono, Inconsolata, Source_Code_Pro } from 'next/font/google';

import { getStoryblokApi } from '@/lib/storyblok';

import Tiles from '@/components/layout/Tiles';
import Navigation from '@/components/layout/Navigation';
import StoryblokProvider from '@/components/context/StoryblokProvider';

import './globals.css';

const sourceCodePro = Source_Code_Pro({
    subsets: ['latin'],
    weight: 'variable',
});

export const metadata: Metadata = {
    title: 'Create Next App',
    description: 'Generated by create next app',
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
            <html lang="en">
                <body className={`${sourceCodePro.className} antialiased`}>
                    <Navigation items={menuItems} />
                    <Tiles>{children}</Tiles>
                </body>
            </html>
        </StoryblokProvider>
    );
}
