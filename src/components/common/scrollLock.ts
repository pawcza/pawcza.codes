import { useEffect } from 'react';

let locks = 0;
let previous = '';

/**
 * Holds the page still while a modal is open, so a swipe scrolls the modal
 * rather than the page under it (and the nav, which tucks away on scroll).
 * On the root element, not body: that is the one iOS Safari honours. Counted,
 * so two modals open at once cannot unlock each other. With `query`, it only
 * applies while that media query matches.
 */
export const useScrollLock = (active: boolean, query?: string) => {
    useEffect(() => {
        if (!active) return;
        if (query && !window.matchMedia(query).matches) return;

        const root = document.documentElement;
        if (locks === 0) {
            previous = root.style.overflow;
            root.style.overflow = 'hidden';
        }
        locks++;

        return () => {
            locks--;
            if (locks === 0) root.style.overflow = previous;
        };
    }, [active, query]);
};
