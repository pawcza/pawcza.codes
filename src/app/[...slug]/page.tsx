import { StoryblokClient, ISbStoriesParams } from '@storyblok/react';
import { StoryblokStory } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@/lib/storyblok';

export default async function DynamicPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const slug = (await params).slug;

    const { data } = await fetchData(slug);

    if (!data) return;

    return <StoryblokStory story={data.story} />;
}

const fetchData = (slug: string[]) => {
    const sbParams: ISbStoriesParams = { version: 'draft' };
    const storyblokApi: StoryblokClient = getStoryblokApi();

    return storyblokApi.get(`cdn/stories/${slug.join('/')}`, sbParams);
};
