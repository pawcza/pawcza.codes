import MatrixText from '@/components/common/MatrixText';
import {ISbStoriesParams, StoryblokClient} from '@storyblok/react';
import {getStoryblokApi} from '@/lib/storyblok';
import {PostStoryblok} from '@/types/component-types-sb';
import Link from 'next/link';
import {StoryblokComponent} from '@/types/storyblok';
import Tag from '@/components/common/Tag';

const fetchPosts = async () => {
	const sbParams: ISbStoriesParams = {
		version: 'draft',
		resolve_relations: 'navigation.items',
		content_type: 'post',
		excluding_fields: 'content',
	};
	const storyblokApi: StoryblokClient = getStoryblokApi();

	const {data} = await storyblokApi.get('cdn/stories', sbParams);
	return data.stories;
};

const Listing = async () => {
	const posts = await fetchPosts();

	return (
		<section className="mt-4 flex flex-col gap-2 relative mx-auto w-full min-h-52 break-words">
			{posts.map((post: StoryblokComponent<PostStoryblok>) => {
				const {tags, title, date} = post.content;

				return (
					<Link
						key={post.uuid}
						href={post.full_slug}
						className="w-full bg-background p-4 flex items-center justify-between rounded-md hover:bg-foreground hover:text-background transition-colors font-semibold"
					>
						{title && (
							<MatrixText
								ordered
								classNames="text-3xl italic font-bold"
							>
								{title}
							</MatrixText>
						)}
						{tags && (
							<div className="flex gap-4 items-center">
								{date && (
									<MatrixText ordered>
										{new Date(date).toLocaleDateString(
											`pl-PL`,
										)}
									</MatrixText>
								)}
								{tags.map((tag) => (
									<Tag key={tag} tag={tag}/>
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
