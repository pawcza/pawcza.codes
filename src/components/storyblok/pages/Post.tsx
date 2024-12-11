import { storyblokEditable } from '@storyblok/react/rsc';
import { PostStoryblok } from '@/types/component-types-sb';
import MatrixText from '@/components/common/MatrixText';
import IconLink from '@/components/common/IconLink';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import Link from 'next/link';
import Markdown from 'react-markdown';
import Tag from '@/components/common/Tag';

const Post = ({ blok }: { blok: PostStoryblok }) => {
    const { title, tags, content, date } = blok;

    return (
        <main className="h-full" {...storyblokEditable(blok)}>
            <div className="bg-background mb-2 flex w-fit items-center rounded-md">
                <IconLink
                    inverted
                    href="/blog"
                    MuiIcon={ArrowBackOutlined}
                    internal
                />{' '}
                <Link
                    href="../blog"
                    className="inline-block w-full h-full px-2"
                >
                    <MatrixText ordered>Back to all posts</MatrixText>
                </Link>
            </div>
            <div className="w-full bg-background p-4 flex items-center justify-between mb-2 rounded-md font-semibold">
                {title && (
                    <MatrixText ordered classNames="text-3xl italic font-bold">
                        {title}
                    </MatrixText>
                )}
                {tags && (
                    <div className="flex gap-4 items-center">
                        {date && (
                            <MatrixText ordered>
                                {new Date(date).toLocaleDateString(`pl-PL`)}
                            </MatrixText>
                        )}
                        {tags.map((tag) => (
                            <Tag key={tag} tag={tag} />
                        ))}
                    </div>
                )}
            </div>
            <section className="bg-background p-4 mb-8 rounded-md">
                <Markdown className="markdown">{content}</Markdown>
            </section>
        </main>
    );
};

export default Post;
