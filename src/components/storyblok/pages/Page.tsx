import {
    storyblokEditable,
    StoryblokServerComponent,
} from '@storyblok/react/rsc';
import { PageStoryblok } from '@/types/component-types-sb';

const Page = ({ blok }: { blok: PageStoryblok }) => (
    <main className="h-full" {...storyblokEditable(blok)}>
        {blok.body?.map((nestedBlok) => (
            <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
    </main>
);

export default Page;
