'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const createSeedFromString = (value: string) => {
    let hash = 1779033703 ^ value.length;
    for (let i = 0; i < value.length; i++) {
        hash = Math.imul(hash ^ value.charCodeAt(i), 3432918353);
        hash = (hash << 13) | (hash >>> 19);
    }
    return hash >>> 0;
};

const mulberry32 = (seed: number) => {
    let t = seed || 1;
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
};

/** How close, in px, the cursor must come to a letter to scramble it. */
const HOVER_TOLERANCE = 10;

/** Spaces and newlines are never scrambled. */
const isWhitespace = (char: string) => /\s/.test(char);

const getRandomChar = (
    exclude: string,
    randomFn: () => number = Math.random,
): string => {
    const chars = '0123456789#ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let newChar = exclude;
    while (newChar === exclude) {
        newChar = chars.charAt(Math.floor(randomFn() * chars.length));
    }
    return newChar;
};

interface MatrixTextProps {
    duration?: number;
    flickerInterval?: number;
    children: string;
    classNames?: string;
    hasStarted?: boolean;
    /** Hold the scramble until the text is scrolled into view, then resolve. */
    startOnView?: boolean;
    /** Monospace keeps glyph widths even while scrambling. */
    mono?: boolean;
}

const MatrixText = ({
    children,
    classNames,
    duration,
    flickerInterval = 25,
    hasStarted = true,
    startOnView = false,
    mono = true,
}: MatrixTextProps) => {
    const headline = children.split('');
    const length = headline.length;

    const containerRef = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    // A character-by-character scramble is precisely what motion sensitivity
    // struggles with, so resolve straight to the final text instead.
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduceMotion(query.matches);

        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    // When driven by scroll position, the caller's `hasStarted` still gates it.
    const started = startOnView ? inView && hasStarted : hasStarted;

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

    const effectiveDuration = duration ?? 500 + length * 20;

    const seed = useMemo(() => createSeedFromString(children), [children]);
    const seededDisplayRandom = useMemo(
        () => mulberry32(seed || 1),
        [seed],
    );
    const seededOpacityRandom = useMemo(
        () => mulberry32((seed || 1) ^ 0x9e3779b9),
        [seed],
    );

    const [displayText, setDisplayText] = useState<string[]>(() =>
        headline.map((ch) =>
            isWhitespace(ch) ? ch : getRandomChar(' ', seededDisplayRandom),
        ),
    );

    const displayRef = useRef(displayText);
    const statusRef = useRef<boolean[]>(headline.map(isWhitespace));
    const randomOpacities = useRef(headline.map(() => seededOpacityRandom()));
    const lastFlickerTime = useRef<number[]>(Array(length).fill(0));
    const animationFrame = useRef<number>();
    const startTime = useRef<number>(performance.now());

    const timeToReveal = useRef<number[]>(
        headline.map((_, i) => (effectiveDuration / length) * i),
    );

    /*
     * Hover scramble. A letter under the cursor (within HOVER_TOLERANCE px)
     * holds until Infinity and keeps flickering; once the cursor moves off it
     * gets a short random delay, then resolves again like the first reveal.
     */
    const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const hoverUntil = useRef<number[]>(Array(length).fill(0));
    const startedRef = useRef(started);
    startedRef.current = started;

    const animate = (time: number) => {
        const elapsed = time - startTime.current;
        const currentDisplay = [...displayRef.current];
        const currentStatus = [...statusRef.current];
        let hasChanged = false;

        for (let i = 0; i < length; i++) {
            if (isWhitespace(headline[i])) {
                // Spaces and line breaks pass through untouched, so multi-line
                // text keeps its shape while the rest scrambles.
                currentDisplay[i] = headline[i];
                currentStatus[i] = true;
                continue;
            }

            const timeSinceLastFlicker = time - lastFlickerTime.current[i];
            const hoverScramble = time < hoverUntil.current[i];

            if (hoverScramble) {
                if (timeSinceLastFlicker > flickerInterval) {
                    currentDisplay[i] = getRandomChar(currentDisplay[i] || ' ');
                    lastFlickerTime.current[i] = time;
                    hasChanged = true;
                }
                if (currentStatus[i]) hasChanged = true;
                currentStatus[i] = false;
            } else if (started) {
                const shouldReveal = elapsed >= timeToReveal.current[i];
                if (shouldReveal) {
                    currentDisplay[i] = headline[i];
                    currentStatus[i] = true;
                    hasChanged = true;
                } else if (timeSinceLastFlicker > flickerInterval) {
                    currentDisplay[i] = getRandomChar(currentDisplay[i] || ' ');
                    lastFlickerTime.current[i] = time;
                    hasChanged = true;
                }
            } else {
                if (timeSinceLastFlicker > flickerInterval) {
                    currentDisplay[i] = getRandomChar(currentDisplay[i] || ' ');
                    lastFlickerTime.current[i] = time;
                    hasChanged = true;
                }
                currentStatus[i] = false; // Reset status when not started
            }
        }

        if (hasChanged) {
            displayRef.current = currentDisplay;
            statusRef.current = currentStatus;
            setDisplayText(currentDisplay);
        }

        if (!currentStatus.every(Boolean) || !started) {
            animationFrame.current = requestAnimationFrame(animate);
        } else {
            animationFrame.current = undefined;
        }
    };

    // The loop stops once everything is revealed; hovering restarts it.
    const animateRef = useRef(animate);
    animateRef.current = animate;

    useEffect(() => {
        if (reduceMotion) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return;
        }

        let anyHovered = false;

        const onMove = (event: PointerEvent) => {
            if (event.pointerType === 'touch' || !startedRef.current) return;
            const box = containerRef.current?.getBoundingClientRect();
            if (!box) return;

            const { clientX: x, clientY: y } = event;
            const inside =
                x >= box.left - HOVER_TOLERANCE &&
                x <= box.right + HOVER_TOLERANCE &&
                y >= box.top - HOVER_TOLERANCE &&
                y <= box.bottom + HOVER_TOLERANCE;
            // Far away with nothing scrambled: skip measuring every letter.
            if (!inside && !anyHovered) return;

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

            if (changed && animationFrame.current === undefined) {
                animationFrame.current = requestAnimationFrame((t) =>
                    animateRef.current(t),
                );
            }
        };

        document.addEventListener('pointermove', onMove, { passive: true });
        return () => document.removeEventListener('pointermove', onMove);
    }, [reduceMotion]);

    useEffect(() => {
        if (reduceMotion) {
            displayRef.current = headline;
            statusRef.current = headline.map(() => true);
            setDisplayText(headline);
            return;
        }

        if (started) {
            startTime.current = performance.now();
        }
        animationFrame.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, [started, reduceMotion]);

    return (
        <div
            ref={containerRef}
            className={classNames}
            style={{
                display: 'grid',
                fontFamily: mono
                    ? 'var(--font-mono), ui-monospace, monospace'
                    : undefined,
                transition: 'opacity 0.2s ease-in-out',
                whiteSpace: 'pre-wrap', // Preserve spaces and line breaks
            }}
        >
            {/*
             * The real text, laid out but invisible. It reserves the final box
             * so scrambling never shifts the page, and it is what screen
             * readers and crawlers get. The animated copy on top is decorative.
             */}
            <span style={{ gridArea: '1 / 1', opacity: 0 }}>{children}</span>
            <span
                aria-hidden="true"
                style={{ gridArea: '1 / 1', userSelect: 'none' }}
            >
                {displayText.map((char, index) =>
                    isWhitespace(headline[index]) ? (
                        headline[index]
                    ) : (
                        /*
                         * Each letter gets a slot exactly as wide as its final
                         * glyph (the hidden copy), and the scrambled character
                         * is centred over it. Proportional glyphs no longer
                         * push their neighbours around while they flicker.
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
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    opacity: statusRef.current[index]
                                        ? 1
                                        : randomOpacities.current[index],
                                    willChange: 'opacity',
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
        </div>
    );
};

export default MatrixText;
