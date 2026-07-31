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

            if (started) {
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
        }
    };

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
                {displayText.map((char, index) => (
                    <span
                        key={index}
                        style={{
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
                ))}
            </span>
        </div>
    );
};

export default MatrixText;
