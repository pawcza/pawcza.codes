import {
    storyblokEditable,
    StoryblokServerComponent,
} from '@storyblok/react/rsc';

import { GridStoryblok } from '@/types/component-types-sb';

const Grid = ({ blok }: { blok: GridStoryblok }) => {
    const getGap = (gap?: string) => {
        if (!gap) return 'gap-4';

        const gapNumber = parseInt(gap, 10);

        switch (gapNumber) {
            case 1:
                return 'gap-1';
            case 2:
                return 'gap-2';
            case 3:
                return 'gap-3';
            case 4:
                return 'gap-4';
            case 5:
                return 'gap-5';
            case 6:
                return 'gap-6';
            case 7:
                return 'gap-7';
            case 8:
                return 'gap-8';
            case 9:
                return 'gap-9';
            case 10:
                return 'gap-10';
            default:
                return 'gap-4';
        }
    };

    return (
        <div
            className={`h-full flex ${blok.justifyContent} ${blok.alignItems} ${blok.layout} ${getGap(blok.gap)}`}
            {...storyblokEditable(blok)}
        >
            {blok.body?.map((nestedBlok) => (
                <StoryblokServerComponent
                    blok={nestedBlok}
                    key={nestedBlok._uid}
                />
            ))}
        </div>
    );
};

export default Grid;
