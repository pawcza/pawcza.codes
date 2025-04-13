import { ISbStoriesParams, StoryblokClient } from '@storyblok/react';
import { getStoryblokApi } from '@/lib/storyblok';
import { PostStoryblok } from '@/types/component-types-sb';
import { Link } from 'next-view-transitions';
import { StoryblokComponent } from '@/types/storyblok';
import { BlogPost } from '@/components/common/BlogPost';

const fetchPosts = async () => {
    const sbParams: ISbStoriesParams = {
        version: 'draft',
        resolve_relations: 'navigation.items',
        content_type: 'post',
        excluding_fields: 'content',
    };
    const storyblokApi: StoryblokClient = getStoryblokApi();

    const { data } = await storyblokApi.get('cdn/stories', sbParams);
    return data.stories;
};

const Listing = async () => {
    const posts = await fetchPosts();

    return (
        <section className="mt-4 flex flex-col gap-2 relative mx-auto w-full min-h-52 break-words">
            {posts.map((post: StoryblokComponent<PostStoryblok>) => {
                const { tags, title, date } = post.content;

                return (
                    <Link key={post.uuid} href={post.full_slug}>
                        <BlogPost
                            title={title}
                            tags={tags}
                            date={date}
                            _uid={post.uuid}
                            component="post"
                            type="listing"
                        />
                    </Link>
                );
            })}
        </section>
    );
};

export default Listing;
