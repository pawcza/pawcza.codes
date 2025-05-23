import { StoryblokClient, ISbStoriesParams } from '@storyblok/react';
import { StoryblokStory } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@/lib/storyblok'; // Remember to import from the local file

export default async function Home() {
    const { data } = await fetchData();

    return <StoryblokStory story={data.story} />;
}

const fetchData = () => {
    const sbParams: ISbStoriesParams = {
        version: 'draft',
    };
    const storyblokApi: StoryblokClient = getStoryblokApi();

    return storyblokApi.get(`cdn/stories/home`, sbParams);
};
