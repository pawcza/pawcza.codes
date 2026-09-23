'use client';

import { useEffect } from 'react';

import { isSoftwareRendered } from '@/components/common/gpu';
import { useIntroDone } from '@/components/common/intro';
import { backOut, seeded } from '@/components/work/TileReveal';

/** Matches the project covers' build: the same pop, a similar sweep. */
const POP_MS = 420;
const SWEEP_MS = 520;
const JITTER_MS = 160;
/** Squares per element, beyond which they are made bigger rather than more. */
const MAX_SQUARES = 120;
/**
 * Every mask change is a repaint of the text, so it changes at most this
 * often; on a 165Hz screen, repainting every frame nearly tripled the cost
 * for motion nobody could tell apart.
 */
const MIN_FRAME_MS = 15;

/**
 * Text that builds itself in square by square as it scrolls into view, like
 * the project covers. Anything marked `data-squares` qualifies (optionally
 * with `data-squares-delay`, in seconds), so server components opt in with an
 * attribute rather than a client wrapper.
 *
 * The squares are a CSS mask on the text itself, one gradient layer per
 * square still moving, rewritten while it builds and removed once it is done.
 * Landed squares merge into runs and whole rows, so the mask gets simpler as
 * the build goes rather than heavier.
 * Until then the text is at opacity 0, never visibility: hidden, so screen
 * readers still read it. Reduced motion and software rendering show it at
 * once. Matrix headings keep their own scramble; the covers their own build.
 */
const SquareText = () => {
    // Whatever is on screen at load waits for the loader, as every reveal does.
    const introDone = useIntroDone();

    useEffect(() => {
        if (!introDone) return;

        const frames = new Set<number>();

        const setMask = (
            el: HTMLElement,
            image: string,
            size: string,
            position: string,
        ) => {
            const { style } = el;
            style.maskImage = style.webkitMaskImage = image;
            style.maskSize = style.webkitMaskSize = size;
            style.maskPosition = style.webkitMaskPosition = position;
            style.maskRepeat = style.webkitMaskRepeat = image
                ? 'no-repeat'
                : '';
        };

        const finish = (el: HTMLElement) => {
            setMask(el, '', '', '');
            el.dataset.squares = 'done';
        };

        const build = (el: HTMLElement) => {
            const { width, height } = el.getBoundingClientRect();
            if (
                width === 0 ||
                height === 0 ||
                isSoftwareRendered() ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ) {
                finish(el);
                return;
            }

            // Squares a little over a line of this text, larger for long blocks.
            const font = parseFloat(getComputedStyle(el).fontSize) || 16;
            let cell = Math.max(16, Math.round(font * 1.6));
            while (
                Math.ceil(width / cell) * Math.ceil(height / cell) >
                MAX_SQUARES
            ) {
                cell += 2;
            }
            const cols = Math.ceil(width / cell);
            const rows = Math.ceil(height / cell);

            // Seeded by the text, so each block builds its own way, every time.
            const random = seeded(el.textContent ?? '');
            const fromRight = random() < 0.5;
            const fromBottom = random() < 0.5;
            const step = SWEEP_MS / Math.max(1, cols + rows - 2);
            const delays = Array.from({ length: cols * rows }, (_, i) => {
                const col = i % cols;
                const row = (i - col) / cols;
                const x = fromRight ? cols - 1 - col : col;
                const y = fromBottom ? rows - 1 - row : row;
                return (x + y) * step + random() * JITTER_MS;
            });
            const total = Math.max(...delays) + POP_MS;

            // Fully masked before it is made visible, so nothing flashes.
            setMask(el, 'linear-gradient(transparent, transparent)', '', '');
            el.dataset.squares = 'play';

            const start =
                performance.now() + Number(el.dataset.squaresDelay ?? 0) * 1000;

            let lastDraw = 0;

            const draw = (now: number) => {
                frames.delete(frame);
                const elapsed = now - start;
                if (elapsed >= total) {
                    finish(el);
                    return;
                }
                if (now - lastDraw < MIN_FRAME_MS) {
                    frame = requestAnimationFrame(draw);
                    frames.add(frame);
                    return;
                }
                lastDraw = now;

                const images: string[] = [];
                const sizes: string[] = [];
                const positions: string[] = [];
                const add = (
                    alpha: string,
                    x: number,
                    y: number,
                    w: number,
                    h: number,
                ) => {
                    const black = `rgba(0,0,0,${alpha})`;
                    images.push(`linear-gradient(${black},${black})`);
                    sizes.push(`${w.toFixed(1)}px ${h.toFixed(1)}px`);
                    positions.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
                };

                // Consecutive rows that have fully landed, as one layer.
                let doneFrom = -1;
                const flushRows = (end: number) => {
                    if (doneFrom < 0) return;
                    add(
                        '1',
                        0,
                        doneFrom * cell,
                        cols * cell,
                        (end - doneFrom) * cell,
                    );
                    doneFrom = -1;
                };

                for (let row = 0; row < rows; row++) {
                    const first = row * cols;
                    let rowDone = true;
                    for (let col = 0; col < cols; col++) {
                        if (elapsed - delays[first + col] < POP_MS) {
                            rowDone = false;
                            break;
                        }
                    }
                    if (rowDone) {
                        if (doneFrom < 0) doneFrom = row;
                        continue;
                    }
                    flushRows(row);

                    // Landed squares side by side, as one layer per run.
                    let runFrom = -1;
                    for (let col = 0; col < cols; col++) {
                        const t = (elapsed - delays[first + col]) / POP_MS;
                        if (t >= 1) {
                            if (runFrom < 0) runFrom = col;
                            continue;
                        }
                        if (runFrom >= 0) {
                            add(
                                '1',
                                runFrom * cell,
                                row * cell,
                                (col - runFrom) * cell,
                                cell,
                            );
                            runFrom = -1;
                        }
                        if (t <= 0) continue;
                        const side = cell * (0.2 + 0.8 * backOut(t));
                        const inset = (cell - side) / 2;
                        add(
                            Math.min(1, t / 0.4).toFixed(2),
                            col * cell + inset,
                            row * cell + inset,
                            side,
                            side,
                        );
                    }
                    if (runFrom >= 0) {
                        add(
                            '1',
                            runFrom * cell,
                            row * cell,
                            (cols - runFrom) * cell,
                            cell,
                        );
                    }
                }
                flushRows(rows);

                if (images.length) {
                    setMask(
                        el,
                        images.join(','),
                        sizes.join(','),
                        positions.join(','),
                    );
                }
                frame = requestAnimationFrame(draw);
                frames.add(frame);
            };

            let frame = requestAnimationFrame(draw);
            frames.add(frame);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    observer.unobserve(entry.target);
                    build(entry.target as HTMLElement);
                }
            },
            // A little way in, so the build plays where it is seen.
            { rootMargin: '0px 0px -8% 0px' },
        );

        document
            .querySelectorAll<HTMLElement>('[data-squares=""]')
            .forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
            frames.forEach((id) => cancelAnimationFrame(id));
        };
    }, [introDone]);

    return null;
};

export default SquareText;
