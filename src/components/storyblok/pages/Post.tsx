import { storyblokEditable } from '@storyblok/react/rsc';
import { PostStoryblok } from '@/types/component-types-sb';
import { BlogPost } from '@/components/common/BlogPost';

const Post = ({ blok }: { blok: PostStoryblok }) => {
    return (
        <main className="h-full" {...storyblokEditable(blok)}>
            <BlogPost {...blok} type="post" />
        </main>
    );
};

export default Post;
