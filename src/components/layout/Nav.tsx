'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

const items = [
    // `compact` items are the ones that still fit in a 390px pill.
    { id: 'top', label: 'pawcza.codes', compact: true, mono: true },
    { id: 'work', label: 'Work', compact: true, mono: false },
    { id: 'experience', label: 'Experience', compact: true, mono: false },
    { id: 'stack', label: 'Stack', compact: false, mono: false },
    { id: 'about', label: 'About', compact: false, mono: false },
    { id: 'contact', label: 'Contact', compact: true, mono: false },
];

const Nav = () => {
    const [active, setActive] = useState('top');
    // The link the pill actually sits on. Differs from `active` only when the
    // active section has no visible link at this breakpoint.
    const [highlighted, setHighlighted] = useState('top');
    const [stuck, setStuck] = useState(false);
    // Rendered position of the travelling highlight, in track coordinates.
    const [pill, setPill] = useState({ left: 0, width: 0, visible: false });

    const trackRef = useRef<HTMLDivElement>(null);
    const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

    /** Snap the pill onto whichever link is currently active. */
    const measure = useCallback(() => {
        // Stack and About are hidden on small screens and report zero width.
        // Rather than dropping the pill, walk back to the last visible link so
        // it reads as "somewhere past Experience" instead of looking broken.
        let index = items.findIndex((item) => item.id === active);
        let link = linkRefs.current[active];

        while (index > 0 && (!link || link.offsetWidth === 0)) {
            index -= 1;
            link = linkRefs.current[items[index].id];
        }

        if (!link || link.offsetWidth === 0) {
            setPill((current) => ({ ...current, visible: false }));
            return;
        }

        setHighlighted(items[index].id);
        setPill({
            left: link.offsetLeft,
            width: link.offsetWidth,
            visible: true,
        });
    }, [active]);

    useLayoutEffect(measure, [measure]);

    useEffect(() => {
        window.addEventListener('resize', measure);
        // Web fonts land after first paint and change link widths.
        document.fonts?.ready.then(measure).catch(() => {});
        return () => window.removeEventListener('resize', measure);
    }, [measure]);

    useEffect(() => {
        let frame = 0;

        const update = () => {
            frame = 0;

            // Roughly where the hero leaves the screen.
            setStuck(window.scrollY > window.innerHeight * 0.78);

            // At the very bottom the last section may never cross the probe
            // line, so pin it explicitly.
            const atBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 4;

            if (atBottom) {
                setActive(items[items.length - 1].id);
                return;
            }

            const probe = window.scrollY + window.innerHeight * 0.35;
            let current = items[0].id;

            for (const item of items) {
                const section = document.getElementById(item.id);
                if (!section) continue;
                const top =
                    section.getBoundingClientRect().top + window.scrollY;
                if (top <= probe) current = item.id;
            }

            setActive(current);
        };

        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            if (frame) cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return (
        <nav
            /*
             * Hidden over the hero, which is meant to be seen unobstructed.
             * `invisible` rather than merely transparent, so the links leave
             * the tab order and the accessibility tree while not shown.
             */
            className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 transition-[opacity,visibility] duration-300 ${
                stuck ? 'visible opacity-100' : 'invisible opacity-0'
            }`}
        >
            <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-paper/80 p-1 shadow-[var(--shadow-card)] backdrop-blur-md">
                <div ref={trackRef} className="relative flex items-center">
                    {/* One element that slides and resizes between links. */}
                    <motion.span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 rounded-full bg-ink"
                        initial={false}
                        animate={{
                            x: pill.left,
                            width: pill.width,
                            opacity: pill.visible ? 1 : 0,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 420,
                            damping: 38,
                            mass: 0.7,
                        }}
                    />

                    {items.map((item) => {
                        const isActive = highlighted === item.id;

                        return (
                            <a
                                key={item.id}
                                ref={(node) => {
                                    linkRefs.current[item.id] = node;
                                }}
                                href={`#${item.id}`}
                                aria-current={isActive ? 'true' : undefined}
                                className={`relative z-10 whitespace-nowrap rounded-full px-2 py-1.5 text-[0.8125rem] font-medium transition-colors duration-200 sm:px-3.5 ${
                                    item.mono ? 'font-mono' : ''
                                } ${item.compact ? '' : 'hidden sm:inline-block'} ${
                                    isActive
                                        ? 'text-paper'
                                        : 'text-ink-muted hover:text-ink'
                                }`}
                            >
                                {item.label}
                            </a>
                        );
                    })}
                </div>

            </div>
        </nav>
    );
};

export default Nav;
