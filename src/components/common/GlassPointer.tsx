'use client';

import { useEffect } from 'react';

/** Everything with a border that lights up, plus the glass surfaces. */
const SELECTOR =
    '.glass, .card, .glass-pill, .chip, .edge, .edge-line, .edge-line-v, .project-dialog';

/** The glow is full strength on the element and gone 100px outside it. */
const FADE_DISTANCE = 100;

/**
 * One pointer listener for the whole page. For every bordered element near the
 * cursor it writes the cursor position in that element's own coordinates
 * (`--glow-x`, `--glow-y`) and a strength (`--glow-o`) that falls off with
 * distance, which the edge rings in globals.css paint from.
 * Scrolling re-runs it too, since the page moves under a still cursor.
 *
 * Mouse and pen only: on touch there is no cursor to follow, so the listener
 * is never attached and the borders stay plain.
 */
const GlassPointer = () => {
    useEffect(() => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return;
        }

        // Only elements on or near the screen are measured each frame.
        const visible = new Set<HTMLElement>();
        const lit = new Set<HTMLElement>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const el = entry.target as HTMLElement;
                    if (entry.isIntersecting) visible.add(el);
                    else visible.delete(el);
                }
            },
            { rootMargin: `${FADE_DISTANCE}px` },
        );

        const observed = new WeakSet<Element>();
        const observeAll = () => {
            document.querySelectorAll(SELECTOR).forEach((el) => {
                if (observed.has(el)) return;
                observed.add(el);
                observer.observe(el);
            });
        };
        observeAll();
        // Cards reveal, the dialog fills in: pick up elements as they appear.
        const mutations = new MutationObserver(observeAll);
        mutations.observe(document.body, { childList: true, subtree: true });

        let frame = 0;
        let pointer: { x: number; y: number } | null = null;

        const paint = () => {
            frame = 0;
            if (!pointer) return;
            const { x, y } = pointer;

            for (const el of visible) {
                const rect = el.getBoundingClientRect();
                const localX = x - rect.left;
                const localY = y - rect.top;
                const dx = Math.max(0, -localX, localX - rect.width);
                const dy = Math.max(0, -localY, localY - rect.height);
                const strength = Math.max(
                    0,
                    1 - Math.hypot(dx, dy) / FADE_DISTANCE,
                );

                if (strength === 0) {
                    if (lit.has(el)) {
                        el.style.setProperty('--glow-o', '0');
                        lit.delete(el);
                    }
                    continue;
                }

                el.style.setProperty('--glow-x', `${localX}px`);
                el.style.setProperty('--glow-y', `${localY}px`);
                el.style.setProperty('--glow-o', strength.toFixed(3));
                lit.add(el);
            }

            // Anything that scrolled out of range while lit goes dark.
            for (const el of lit) {
                if (visible.has(el)) continue;
                el.style.setProperty('--glow-o', '0');
                lit.delete(el);
            }
        };

        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(paint);
        };

        const onMove = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            pointer = { x: event.clientX, y: event.clientY };
            schedule();
        };

        const onLeave = () => {
            pointer = { x: -1e4, y: -1e4 };
            schedule();
        };

        document.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
        window.addEventListener('scroll', schedule, {
            passive: true,
            capture: true,
        });

        return () => {
            document.removeEventListener('pointermove', onMove);
            document.documentElement.removeEventListener(
                'pointerleave',
                onLeave,
            );
            window.removeEventListener('scroll', schedule, { capture: true });
            observer.disconnect();
            mutations.disconnect();
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return null;
};

export default GlassPointer;
