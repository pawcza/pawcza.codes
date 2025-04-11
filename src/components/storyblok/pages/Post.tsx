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
            <div className="w-full bg-background p-8 py-4 flex items-center justify-between mb-2 rounded-lg border-foreground border">
                <IconLink
                    href="/blog"
                    MuiIcon={ArrowBackOutlined}
                    internal
                    inverted
                />
                {title && (
                    <MatrixText ordered classNames="text-xl font-bold ml-2">
                        {title}
                    </MatrixText>
                )}
                {date && (
                    <div className="mr-auto">
                        &nbsp; / {new Date(date).toLocaleDateString(`pl-PL`)}
                    </div>
                )}
                {tags && (
                    <div className="flex gap-2 items-center">
                        {tags.map((tag) => (
                            <Tag key={tag} tag={tag} />
                        ))}
                    </div>
                )}
            </div>
            <section className="bg-background p-8 pt-4 rounded-lg border border-foreground">
                <Markdown className="markdown">{content}</Markdown>
            </section>
        </main>
    );
};

export default Post;
