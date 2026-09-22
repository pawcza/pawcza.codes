'use client';

import { useEffect, useRef } from 'react';

/** Squares across and down: 16 × 10 keeps them square on a 16:10 cover. */
const COLS = 16;
const ROWS = 10;
const POP_MS = 420;
const STEP_MS = 28;
const JITTER_MS = 160;

/** Back-out easing: overshoots a touch, then settles, like a brick clicking in. */
const backOut = (t: number) => {
    const c = 1.56;
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

const seeded = (seed: string) => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
};

/**
 * The cover assembling itself, square by square, like the tile field in the
 * hero. Drawn on one canvas: each frame is ~160 drawImage calls of small
 * slices, for about a second, then the canvas goes away. (It started as 160
 * DOM squares each carrying the whole image as a background, and six covers
 * building at once was a thousand animated layers.) The order is a diagonal
 * sweep with jitter, seeded per project so each cover builds its own way.
 */
const TileReveal = ({
    src,
    seed,
    playing,
    onDone,
}: {
    src: string;
    seed: string;
    playing: boolean;
    /** Fired when the last square has landed. */
    onDone: () => void;
}) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const doneRef = useRef(onDone);
    useEffect(() => {
        doneRef.current = onDone;
    }, [onDone]);

    useEffect(() => {
        const canvas = ref.current;
        const context = canvas?.getContext('2d');
        if (!playing || !canvas || !context) return;

        const random = seeded(seed);
        const fromRight = random() < 0.5;
        const fromBottom = random() < 0.5;
        const delays = Array.from({ length: COLS * ROWS }, (_, i) => {
            const x = fromRight ? COLS - 1 - (i % COLS) : i % COLS;
            const row = Math.floor(i / COLS);
            const y = fromBottom ? ROWS - 1 - row : row;
            return (x + y) * STEP_MS + random() * JITTER_MS;
        });
        const total = Math.max(...delays) + POP_MS;

        let frame = 0;
        let cancelled = false;
        const image = new Image();
        image.src = src;

        image.decode().then(() => {
            if (cancelled) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);

            const cw = canvas.width / COLS;
            const ch = canvas.height / ROWS;
            const sw = image.naturalWidth / COLS;
            const sh = image.naturalHeight / ROWS;
            const start = performance.now();

            const draw = (now: number) => {
                const elapsed = now - start;
                context.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < delays.length; i++) {
                    const t = (elapsed - delays[i]) / POP_MS;
                    if (t <= 0) continue;
                    const p = t >= 1 ? 1 : t;
                    const scale = 0.2 + 0.8 * backOut(p);
                    context.globalAlpha = Math.min(1, p / 0.4);
                    const col = i % COLS;
                    const row = (i - col) / COLS;
                    const w = cw * scale;
                    const h = ch * scale;
                    context.drawImage(
                        image,
                        col * sw,
                        row * sh,
                        sw,
                        sh,
                        col * cw + (cw - w) / 2,
                        row * ch + (ch - h) / 2,
                        w,
                        h,
                    );
                }
                if (elapsed < total) {
                    frame = requestAnimationFrame(draw);
                } else {
                    doneRef.current();
                }
            };
            frame = requestAnimationFrame(draw);
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
        };
    }, [playing, seed, src]);

    return (
        <canvas
            ref={ref}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
        />
    );
};

export default TileReveal;
