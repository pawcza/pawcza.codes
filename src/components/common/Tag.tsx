import { matchTagToColor } from '@/utils';
import React from 'react';
import { PostStoryblok } from '@/types/component-types-sb';

const Tag: React.FC<{ tag: PostStoryblok[number]['tags'] }> = ({ tag }) => {
    return (
        <span
            className={`p-2 text-sm rounded-lg border-2 ${matchTagToColor(tag)}`}
        >
            {tag}
        </span>
    );
};

export default Tag;
