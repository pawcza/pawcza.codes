import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

import Teaser from '@/components/storyblok/blocks/Teaser';
import Page from '@/components/storyblok/pages/Page';
import Contact from '@/components/storyblok/blocks/Contact';
import Grid from '@/components/storyblok/blocks/Grid';
import QuoteOfTheDay from '@/components/storyblok/blocks/QuoteOfTheDay';
import Post from '@/components/storyblok/pages/Post';
import Listing from '@/components/storyblok/blocks/Listing';

export const getStoryblokApi = storyblokInit({
    accessToken: 'CNoMu4HKAPdizxYrRuyzvQtt',
    use: [apiPlugin],
    components: {
        page: Page,
        teaser: Teaser,
        contact: Contact,
        grid: Grid,
        quote_of_the_day: QuoteOfTheDay,
        post: Post,
        listing: Listing,
    },
});
