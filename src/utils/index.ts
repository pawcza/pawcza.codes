import {PostStoryblok} from '@/types/component-types-sb';

export const matchTagToColor = (tag: PostStoryblok[number]['tags']): string => {
	switch (tag) {
		case 'life':
			return 'bg-theme-green text-white';
		case 'code':
			return 'bg-theme-blue text-white';
		case 'travels':
			return 'bg-theme-gold text-black';
		default:
			return 'bg-theme-green text-white';
	}
};
