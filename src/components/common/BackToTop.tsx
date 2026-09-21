'use client';

import { useEffect, useState } from 'react';

import { ArrowUp } from '@/components/common/Icons';

/**
 * Shows once the visitor is past the middle of the page, where getting back up
 * starts to take real scrolling. The nav covers the sections; this covers the
 * page. Hidden elements leave the tab order via `invisible`.
 */
const BackToTop = () => {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const { scrollY, innerHeight } = window;
            const height = document.documentElement.scrollHeight;
            setShown(scrollY + innerHeight > height * 0.5 && scrollY > innerHeight);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0 })}
            aria-label="Back to top"
            title="Back to top"
            className={`glass-pill btn-icon fixed bottom-5 right-4 z-40 !h-10 !w-10 !transition-[opacity,transform,visibility,color] duration-300 sm:bottom-6 sm:right-6 ${
                shown
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible translate-y-2 opacity-0'
            }`}
        >
            <ArrowUp width={16} height={16} />
        </button>
    );
};

export default BackToTop;
