import MatrixText from '@/components/common/MatrixText';
import { ISbStoriesParams, StoryblokClient } from '@storyblok/react';
import { getStoryblokApi } from '@/lib/storyblok';
import { PostStoryblok } from '@/types/component-types-sb';
import Link from 'next/link';
import { StoryblokComponent } from '@/types/storyblok';
import Tag from '@/components/common/Tag';

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
                    <Link
                        key={post.uuid}
                        href={post.full_slug}
                        className="w-full bg-background p-8 flex items-center flex-wrap gap-4 hover:bg-foreground hover:text-background transition-colors font-semibold rounded-lg border border-foreground shadow-2xl"
                    >
                        {title && (
                            <MatrixText ordered classNames="text-xl font-bold">
                                {title}
                            </MatrixText>
                        )}
                        {date && (
                            <div className="mr-auto">
                                / {new Date(date).toLocaleDateString(`pl-PL`)}
                            </div>
                        )}
                        {tags && (
                            <div className="flex gap-2 items-center font-normal">
                                {tags.map((tag) => (
                                    <Tag key={tag} tag={tag} />
                                ))}
                            </div>
                        )}
                    </Link>
                );
            })}
        </section>
    );
};

export default Listing;
