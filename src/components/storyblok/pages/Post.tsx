import { storyblokEditable } from '@storyblok/react/rsc';
import { PostStoryblok } from '@/types/component-types-sb';
import MatrixText from '@/components/common/MatrixText';
import IconLink from '@/components/common/IconLink';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import Link from 'next/link';
import Markdown from 'react-markdown';
import Tag from '@/components/common/Tag';
import { BlogPost } from '@/components/common/BlogPost';

const Post = ({ blok }: { blok: PostStoryblok }) => {
    return (
        <main className="h-full" {...storyblokEditable(blok)}>
            <BlogPost {...blok} type="post" />
        </main>
    );
};

export default Post;
