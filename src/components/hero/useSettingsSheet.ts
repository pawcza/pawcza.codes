'use client';

import React, {
    RefObject,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { animate, useMotionValue, useMotionValueEvent } from 'motion/react';

import type { ControlsAnchor } from '@/components/hero/TileSettings';

/** Below this, the panel is a drawer along the bottom of the screen. */
const SHEET_QUERY = '(max-width: 639px)';
/** How far a drawer can be pulled open, as shares of the screen's height. */
const SHEET_MIN = 0.4;
const SHEET_MAX = 0.6;

export const useSettingsSheet = (
    open: boolean,
    controlsAnchor: ControlsAnchor,
    panelRef: RefObject<HTMLDivElement | null>,
) => {
    /*
     * On a phone the panel is a drawer across the bottom. Collapsed it shows
     * only its handle and randomise; pulled up, anywhere from 40% to 60% of
     * the screen. Its height is published as --settings-sheet, so the
     * full-screen cube can keep above it.
     */
    const [sheet, setSheet] = useState(false);
    useEffect(() => {
        const query = window.matchMedia(SHEET_QUERY);
        const sync = () => setSheet(query.matches);
        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);
    const sheetHeight = useMotionValue(0);
    useMotionValueEvent(sheetHeight, 'change', (height) =>
        document.documentElement.style.setProperty(
            '--settings-sheet',
            `${height}px`,
        ),
    );
    const grabRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    /** The drawer's height with only its handle and buttons showing. */
    const collapsedHeight = () => {
        const panel = panelRef.current;
        const footer = footerRef.current;
        if (!panel || !footer) return 0;
        const box = getComputedStyle(panel);
        return (
            (grabRef.current?.offsetHeight ?? 0) +
            footer.offsetHeight +
            parseFloat(getComputedStyle(footer).marginTop) +
            parseFloat(box.paddingBottom) +
            parseFloat(box.borderTopWidth)
        );
    };
    /** Tallest it goes: 60% of the screen, or less if its page is short. */
    const openHeight = () => {
        const scroll = scrollRef.current;
        const cap = window.innerHeight * SHEET_MAX;
        if (!scroll) return cap;
        const heading = scroll.previousElementSibling as HTMLElement | null;
        const natural =
            collapsedHeight() +
            (heading?.offsetHeight ?? 0) +
            parseFloat(getComputedStyle(scroll).marginTop) +
            scroll.scrollHeight;
        return Math.min(cap, natural);
    };
    const settleSheet = (to: number) =>
        animate(sheetHeight, to, {
            type: 'spring',
            stiffness: 380,
            damping: 38,
        });
    // Beside the full-screen cube it opens collapsed, leaving the cube the
    // screen; over the page it opens part way up, as asked for.
    useLayoutEffect(() => {
        if (!open || !sheet) return;
        sheetHeight.jump(
            controlsAnchor === 'view'
                ? collapsedHeight()
                : Math.min(window.innerHeight * 0.55, openHeight()),
        );
    }, [open, sheet, controlsAnchor]);
    useEffect(() => {
        if (open && sheet) return;
        document.documentElement.style.removeProperty('--settings-sheet');
    }, [open, sheet]);

    const drag = useRef<{
        fromY: number;
        fromHeight: number;
        lastY: number;
        lastTime: number;
        velocity: number;
        moved: boolean;
    } | null>(null);
    const onGrabDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
            fromY: event.clientY,
            fromHeight: sheetHeight.get(),
            lastY: event.clientY,
            lastTime: event.timeStamp,
            velocity: 0,
            moved: false,
        };
    };
    const onGrabMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d) return;
        if (Math.abs(event.clientY - d.fromY) > 4) d.moved = true;
        const dt = Math.max(1, event.timeStamp - d.lastTime);
        // Upwards is negative: px per ms.
        d.velocity = (event.clientY - d.lastY) / dt;
        d.lastY = event.clientY;
        d.lastTime = event.timeStamp;
        const low = collapsedHeight();
        const high = openHeight();
        sheetHeight.set(
            Math.min(
                high,
                Math.max(low, d.fromHeight + d.fromY - event.clientY),
            ),
        );
    };
    const onGrabUp = () => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        const low = collapsedHeight();
        const max = openHeight();
        const min = Math.min(max, window.innerHeight * SHEET_MIN);
        const height = sheetHeight.get();
        // A tap on the handle opens or closes it.
        if (!d.moved) {
            settleSheet(
                height > low + 8
                    ? low
                    : Math.min(window.innerHeight * 0.55, max),
            );
            return;
        }
        // A flick goes where it was flicked; otherwise it rests where it
        // was let go, within its range, or closes if barely pulled.
        if (d.velocity < -0.4)
            settleSheet(Math.min(max, Math.max(min, height)));
        else if (d.velocity > 0.4 || height < low + 60) settleSheet(low);
        else settleSheet(Math.min(max, Math.max(min, height)));
    };

    return {
        sheet,
        sheetHeight,
        grabRef,
        scrollRef,
        footerRef,
        onGrabDown,
        onGrabMove,
        onGrabUp,
    };
};
