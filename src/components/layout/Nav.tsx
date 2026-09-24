'use client';

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { motion } from 'motion/react';

import ThemeToggle from '@/components/common/ThemeToggle';
import {
    Briefcase,
    Grid,
    Home,
    Layers,
    Mail,
    Sliders,
    User,
} from '@/components/common/Icons';
import { useTileSettings } from '@/components/hero/TileSettings';

/**
 * Every section is linked everywhere: phones show the icon, wider screens
 * the label. Home is phone-only; on desktop the hero is one scroll away.
 */
const items = [
    { id: 'top', label: 'Home', Icon: Home, desktop: false },
    { id: 'work', label: 'Projects', Icon: Grid, desktop: true },
    { id: 'experience', label: 'Experience', Icon: Briefcase, desktop: true },
    { id: 'stack', label: 'Stack', Icon: Layers, desktop: true },
    { id: 'about', label: 'About', Icon: User, desktop: true },
    { id: 'contact', label: 'Contact', Icon: Mail, desktop: true },
];

const Nav = () => {
    const { controlsOpen, setControlsOpen } = useTileSettings();
    const [active, setActive] = useState('work');
    // The link the pill actually sits on. Differs from `active` only when the
    // active section has no visible link at this breakpoint.
    const [highlighted, setHighlighted] = useState('work');
    const [stuck, setStuck] = useState(false);
    // Tucked away while scrolling down, back as soon as the visitor scrolls
    // up: going down it only covers what they are reading.
    const [tucked, setTucked] = useState(false);
    // Rendered position of the travelling highlight, in track coordinates.
    const [pill, setPill] = useState({ left: 0, width: 0, visible: false });

    const trackRef = useRef<HTMLDivElement>(null);
    const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

    /** Snap the pill onto whichever link is currently active. */
    const measure = useCallback(() => {
        // Phones only link a few sections. On one without a link (Stack,
        // say) the pill steps aside rather than claiming "Projects".
        const link = linkRefs.current[active];
        const index = items.findIndex((item) => item.id === active);

        if (!link || link.offsetWidth === 0) {
            setHighlighted('');
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
        let lastY = window.scrollY;
        // Direction is only judged past this many pixels, so a trackpad's
        // wobble or a bounce at the edge does not flicker the nav.
        const DEAD_ZONE = 8;

        const update = () => {
            frame = 0;

            const delta = window.scrollY - lastY;
            if (Math.abs(delta) > DEAD_ZONE) {
                setTucked(delta > 0);
                lastY = window.scrollY;
            }

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
             * On phones it is hidden over the hero, which is meant to be seen
             * unobstructed. `invisible` rather than merely transparent, so the
             * links leave the tab order and the accessibility tree while not
             * shown. Tucked (scrolling down) it slides up out of view but
             * stays reachable, sliding back the moment a link takes keyboard
             * focus. From md up there is room for both, so it simply stays.
             */
            className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] transition-[opacity,visibility,transform] duration-300 ease-out ${
                !stuck
                    ? 'invisible opacity-0'
                    : tucked
                      ? 'visible -translate-y-[130%] opacity-0 focus-within:translate-y-0 focus-within:opacity-100'
                      : 'visible opacity-100'
            } md:visible md:translate-y-0 md:opacity-100`}
        >
            <div className="no-scrollbar glass-pill flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1">
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
                                aria-label={item.label}
                                className={`relative z-10 whitespace-nowrap rounded-full px-2 py-1.5 text-small font-medium transition-colors duration-200 sm:px-3.5 ${item.desktop ? '' : 'sm:hidden'} ${
                                    isActive
                                        ? 'text-paper'
                                        : 'text-ink-muted hover:text-ink'
                                }`}
                            >
                                <item.Icon
                                    width={16}
                                    height={16}
                                    className="block px-px sm:hidden"
                                />
                                <span className="hidden sm:inline">
                                    {item.label}
                                </span>
                            </a>
                        );
                    })}
                </div>

                <span
                    aria-hidden="true"
                    className="mx-0.5 h-4 w-px shrink-0 bg-line-strong"
                />
                <ThemeToggle className="btn-icon !h-8 !w-8 shrink-0" />
                <button
                    type="button"
                    data-settings-toggle
                    onClick={() => setControlsOpen(!controlsOpen, 'nav')}
                    title="Background settings"
                    aria-expanded={controlsOpen}
                    className={`btn-icon !h-8 !w-8 shrink-0 ${
                        controlsOpen
                            ? '!text-ink ring-1 ring-inset ring-ink/30'
                            : ''
                    }`}
                >
                    <Sliders width={15} height={15} />
                    <span className="sr-only">Background settings</span>
                </button>
            </div>
        </nav>
    );
};

export default Nav;
