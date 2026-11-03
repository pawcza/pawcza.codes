'use client';

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { afterFieldBuilt } from '@/components/common/introSequence';
import { prefersReducedMotion } from '@/components/common/motion';

/** How close, in px, the cursor must come to a letter to scramble it. */
const HOVER_TOLERANCE = 10;
/** Letters are expanded this far ahead of the viewport, so none flashes plain. */
const AHEAD = '64px';
/** The letters' fade to their final look, before they are folded back up. */
const SETTLE_MS = 220;

/** Spaces and newlines are never scrambled. */
const isWhitespace = (char: string) => /\s/.test(char);

const CHARS = '0123456789#ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const randomChar = (exclude: string) => {
    let next = exclude;
    while (next === exclude) {
        next = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return next;
};

interface MatrixTextProps {
    duration?: number;
    flickerInterval?: number;
    children: string;
    classNames?: string;
    /**
     * For the title, on screen as the page loads: hidden until it can scramble
     * in, which CSS gives up on after a moment. A slow machine gets the plain
     * text then, rather than a scramble starting seconds late.
     */
    intro?: boolean;
    /** Hold the scramble until the text is scrolled into view, then resolve. */
    startOnView?: boolean;
    /** Monospace keeps glyph widths even while scrambling. */
    mono?: boolean;
}

/**
 * Text that resolves out of random characters. The markup is the plain text:
 * that is what the server sends, what readers and crawlers get, and what stays
 * once it has resolved. One span per letter exists only while letters are
 * actually moving (hundreds of them, each layered, stayed on the page before).
 * Kerning is off throughout, as letters in separate spans cannot kern, so
 * folding them back up never shifts the text.
 */
const MatrixText = ({
    children,
    classNames,
    duration,
    flickerInterval = 25,
    intro = false,
    startOnView = false,
    mono = true,
}: MatrixTextProps) => {
    const headline = useMemo(() => children.split(''), [children]);
    const length = headline.length;

    const containerRef = useRef<HTMLDivElement>(null);
    // Null while the text is plain; the characters showing while it is not.
    const [letters, setLetters] = useState<string[] | null>(null);
    const [waiting, setWaiting] = useState(intro);
    const [onScreen, setOnScreen] = useState(false);
    const [inView, setInView] = useState(false);
    // Null until checked after mount: the server cannot know.
    const [animated, setAnimated] = useState<boolean | null>(null);
    const [reduced, setReduced] = useState<boolean | null>(null);

    const lettersRef = useRef<string[] | null>(null);
    const statusRef = useRef<boolean[]>(headline.map(isWhitespace));
    const opacities = useRef(headline.map(() => Math.random()));
    const lastFlicker = useRef<number[]>(Array(length).fill(0));
    const hoverUntil = useRef<number[]>(Array(length).fill(0));
    const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const frame = useRef<number | undefined>(undefined);
    const foldTimer = useRef(0);
    const startTime = useRef(0);
    // True once the first reveal has played, or been skipped.
    const finished = useRef(false);
    const onScreenRef = useRef(false);

    const started = startOnView ? inView : !waiting;
    const startedRef = useRef(started);
    startedRef.current = started;

    const effectiveDuration = duration ?? 500 + length * 20;
    const revealAt = useRef(
        headline.map((_, i) => (effectiveDuration / length) * i),
    );

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => {
            setReduced(query.matches);
            setAnimated(!query.matches);
        };
        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    // The title waits for the field to build in, and for its real font:
    // swapping fonts in front of the visitor moves it. Then, whichever way it
    // goes, it stops being hidden.
    useEffect(() => {
        if (!intro) return;
        let gone = false;
        let cancel = () => {};
        document.fonts.ready.then(() => {
            if (gone) return;
            cancel = afterFieldBuilt(() => {
                const node = containerRef.current;
                const plain =
                    !node ||
                    prefersReducedMotion() ||
                    getComputedStyle(node).opacity !== '0';
                if (plain) finished.current = true;
                setWaiting(false);
            });
        });
        return () => {
            gone = true;
            cancel();
        };
    }, [intro]);

    useEffect(() => {
        if (!startOnView) return;
        const node = containerRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '-10% 0px -10% 0px' },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [startOnView]);

    // Scrambling text nobody can see is pure cost, so everything below only
    // runs while the text is on (or about to come on) screen.
    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                onScreenRef.current = entry.isIntersecting;
                setOnScreen(entry.isIntersecting);
            },
            { rootMargin: AHEAD },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const showLetters = (next: string[] | null) => {
        lettersRef.current = next;
        setLetters(next);
    };

    const scheduleFold = () => {
        window.clearTimeout(foldTimer.current);
        foldTimer.current = window.setTimeout(
            () => showLetters(null),
            SETTLE_MS,
        );
    };

    const animate = (time: number) => {
        const shown = lettersRef.current;
        if (!shown) {
            frame.current = undefined;
            return;
        }
        const elapsed = time - startTime.current;
        const current = [...shown];
        const status = [...statusRef.current];
        let changed = false;

        for (let i = 0; i < length; i++) {
            if (isWhitespace(headline[i])) {
                current[i] = headline[i];
                status[i] = true;
                continue;
            }

            const flicker = time - lastFlicker.current[i] > flickerInterval;
            const hovered = time < hoverUntil.current[i];

            if (
                !hovered &&
                (finished.current ||
                    (started && elapsed >= revealAt.current[i]))
            ) {
                if (current[i] !== headline[i] || !status[i]) changed = true;
                current[i] = headline[i];
                status[i] = true;
                continue;
            }
            if (status[i]) changed = true;
            status[i] = false;
            if (flicker) {
                current[i] = randomChar(current[i] || ' ');
                lastFlicker.current[i] = time;
                changed = true;
            }
        }

        statusRef.current = status;
        if (changed) showLetters(current);

        if (status.every(Boolean) && started) {
            finished.current = true;
            frame.current = undefined;
            scheduleFold();
            return;
        }
        frame.current = onScreenRef.current
            ? requestAnimationFrame((t) => animateRef.current(t))
            : undefined;
    };

    // The loop stops once everything is revealed; hovering restarts it.
    const animateRef = useRef(animate);
    animateRef.current = animate;

    const run = () => {
        window.clearTimeout(foldTimer.current);
        frame.current ??= requestAnimationFrame((t) => animateRef.current(t));
    };

    // Resolve from random characters: on screen, and not yet played.
    useEffect(() => {
        if (!animated || !onScreen || finished.current || waiting) return;
        if (!lettersRef.current) {
            showLetters(
                headline.map((char) =>
                    isWhitespace(char) ? char : randomChar(' '),
                ),
            );
            statusRef.current = headline.map(isWhitespace);
        }
        if (started) startTime.current = performance.now();
        run();
        // `headline` only changes with `children`, and Quote remounts for that.
    }, [animated, onScreen, started, waiting]);

    /*
     * Hover scramble, always: it costs nothing until someone hovers.
     * A letter under the cursor (within HOVER_TOLERANCE px)
     * holds until Infinity and keeps flickering; once the cursor moves off it
     * gets a short random delay, then resolves again like the first reveal.
     * Measured once a frame at most, and only while this text is on screen.
     */
    useEffect(() => {
        if (reduced !== false || !onScreen) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return;
        }

        let anyHovered = false;
        let pending = 0;
        let x = 0;
        let y = 0;

        const measure = () => {
            pending = 0;
            const box = containerRef.current?.getBoundingClientRect();
            if (!box || !startedRef.current) return;

            const inside =
                x >= box.left - HOVER_TOLERANCE &&
                x <= box.right + HOVER_TOLERANCE &&
                y >= box.top - HOVER_TOLERANCE &&
                y <= box.bottom + HOVER_TOLERANCE;
            // Far away with nothing scrambled: skip measuring every letter.
            if (!inside && !anyHovered) return;

            // Letters are only there to measure once they are unfolded, so
            // this first pass just does that.
            if (!lettersRef.current) {
                statusRef.current = headline.map(() => true);
                showLetters([...headline]);
                return;
            }

            const now = performance.now();
            const until = hoverUntil.current;
            let changed = false;
            anyHovered = false;

            charRefs.current.forEach((el, i) => {
                if (!el || isWhitespace(headline[i])) return;
                const r = el.getBoundingClientRect();
                const near =
                    inside &&
                    x >= r.left - HOVER_TOLERANCE &&
                    x <= r.right + HOVER_TOLERANCE &&
                    y >= r.top - HOVER_TOLERANCE &&
                    y <= r.bottom + HOVER_TOLERANCE;

                if (near) {
                    anyHovered = true;
                    if (until[i] !== Infinity) {
                        until[i] = Infinity;
                        changed = true;
                    }
                } else if (until[i] === Infinity) {
                    until[i] = now + 60 + Math.random() * 240;
                    changed = true;
                }
            });

            if (changed) run();
            else if (frame.current === undefined) scheduleFold();
        };

        const onMove = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            x = event.clientX;
            y = event.clientY;
            pending ||= requestAnimationFrame(measure);
        };

        document.addEventListener('pointermove', onMove, { passive: true });
        return () => {
            document.removeEventListener('pointermove', onMove);
            cancelAnimationFrame(pending);
        };
    }, [reduced, onScreen, headline]);

    // Stepped down mid-scramble: plain text at once.
    useEffect(() => {
        if (animated !== false) return;
        finished.current = true;
        showLetters(null);
    }, [animated]);

    useEffect(
        () => () => {
            window.clearTimeout(foldTimer.current);
            if (frame.current !== undefined) {
                cancelAnimationFrame(frame.current);
            }
        },
        [],
    );

    return (
        <div
            ref={containerRef}
            data-intro={waiting ? '' : undefined}
            className={classNames}
            style={{
                display: 'grid',
                fontFamily: mono
                    ? 'var(--font-mono), ui-monospace, monospace'
                    : undefined,
                whiteSpace: 'pre-wrap', // Preserve spaces and line breaks
                fontKerning: 'none',
                fontVariantLigatures: 'none',
            }}
        >
            {/*
             * The real text. It reserves the final box, so scrambling never
             * shifts the page, and it is what screen readers get throughout.
             */}
            <span
                style={{ gridArea: '1 / 1', opacity: letters ? 0 : undefined }}
            >
                {children}
            </span>
            {letters && (
                <span
                    aria-hidden="true"
                    style={{ gridArea: '1 / 1', userSelect: 'none' }}
                >
                    {letters.map((char, index) =>
                        isWhitespace(headline[index]) ? (
                            headline[index]
                        ) : (
                            /*
                             * Each letter gets a slot exactly as wide as its
                             * final glyph, and the scrambled character is
                             * centred over it, so proportional glyphs do not
                             * push their neighbours around as they flicker.
                             */
                            <span
                                key={index}
                                ref={(el) => {
                                    charRefs.current[index] = el;
                                }}
                                style={{ position: 'relative' }}
                            >
                                <span style={{ visibility: 'hidden' }}>
                                    {headline[index]}
                                </span>
                                <span
                                    // Centred as a flex item, as the slot is
                                    // only the font's height: on a tight line
                                    // a plain block sat 17px above the real
                                    // text on the title.
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        whiteSpace: 'nowrap',
                                        opacity: statusRef.current[index]
                                            ? 1
                                            : opacities.current[index],
                                        transition: statusRef.current[index]
                                            ? 'opacity 0.2s ease-in-out'
                                            : 'none',
                                    }}
                                >
                                    {char}
                                </span>
                            </span>
                        ),
                    )}
                </span>
            )}
        </div>
    );
};

export default memo(MatrixText);
