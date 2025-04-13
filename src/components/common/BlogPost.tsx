import { PostStoryblok } from '@/types/component-types-sb';
import MatrixText from '@/components/common/MatrixText';
import Tag from '@/components/common/Tag';
import Markdown from 'react-markdown';

export const BlogPost = ({
    title,
    tags,
    date,
    content,
    _uid,
    type = 'listing',
}: { type?: 'listing' | 'post' } & PostStoryblok) => {
    return (
        <>
            <div
                className={`w-full mb-2 bg-background p-8 flex items-center flex-wrap gap-4 rounded-lg border border-foreground shadow-2xl ${type === 'listing' ? 'hover:bg-foreground hover:text-background transition-colors' : ''}`}
                style={{
                    viewTransitionName: `view-transition-post-${_uid}`,
                }}
            >
                {title && (
                    <MatrixText classNames="font-bold text-lg">
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
            </div>
            {content && (
                <Markdown className="markdown p-8 bg-background border border-foreground shadow-2xl rounded-lg">
                    {content}
                </Markdown>
            )}
        </>
    );
};
