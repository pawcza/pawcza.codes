import { PostStoryblok } from '@/types/component-types-sb';

export const matchTagToColor = (tag: PostStoryblok[number]['tags']): string => {
    switch (tag) {
        case 'life':
            return 'border-theme-green text-theme-green';
        case 'code':
            return 'border-theme-blue text-theme-blue';
        case 'travels':
            return 'border-theme-gold text-theme-gold';
        default:
            return 'border-theme-green text-theme-green';
    }
};
