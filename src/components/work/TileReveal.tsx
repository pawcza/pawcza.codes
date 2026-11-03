'use client';

import { RefObject, useEffect, useRef } from 'react';

/** Squares across and down: 16 × 10 keeps them square on a 16:10 cover. */
const COLS = 16;
const ROWS = 10;
const POP_MS = 420;
const STEP_MS = 28;
const JITTER_MS = 160;

/** Back-out easing: overshoots a touch, then settles, like a brick clicking in. */
export const backOut = (t: number) => {
    const c = 1.56;
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

export const seeded = (seed: string) => {
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
    image: imageRef,
    seed,
    playing,
    onDone,
}: {
    /** The cover's own image, so the file is not fetched a second time. */
    image: RefObject<HTMLImageElement | null>;
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
        const image = imageRef.current;
        if (!playing || !canvas || !context || !image) return;

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

        // Not the page's <img> itself: its reported size comes from `sizes`,
        // while drawImage cuts from the pixels of whichever srcset file loaded,
        // so slices came out of the wrong part of the picture. A plain Image of
        // that same URL reports real pixels, and comes from the cache.
        const pixels = new Image();

        const build = () => {
            if (cancelled) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);

            const cw = canvas.width / COLS;
            const ch = canvas.height / ROWS;
            // Cropped as the image underneath is (object-cover), or the cover
            // snaps to a different framing when it takes over.
            const fit = Math.max(
                canvas.width / pixels.naturalWidth,
                canvas.height / pixels.naturalHeight,
            );
            const cropW = canvas.width / fit;
            const cropH = canvas.height / fit;
            const cropX = (pixels.naturalWidth - cropW) / 2;
            const cropY = (pixels.naturalHeight - cropH) / 2;
            const sw = cropW / COLS;
            const sh = cropH / ROWS;
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
                    // Landed tiles sit on whole pixels, or the seams between
                    // them show as a faint grid until the image takes over.
                    const x = col * cw + (cw - w) / 2;
                    const y = row * ch + (ch - h) / 2;
                    const landed = t >= 1;
                    const left = landed ? Math.round(x) : x;
                    const top = landed ? Math.round(y) : y;
                    context.drawImage(
                        pixels,
                        cropX + col * sw,
                        cropY + row * sh,
                        sw,
                        sh,
                        left,
                        top,
                        landed ? Math.round(x + w) - left : w,
                        landed ? Math.round(y + h) - top : h,
                    );
                }
                if (elapsed < total) {
                    frame = requestAnimationFrame(draw);
                } else {
                    doneRef.current();
                }
            };
            frame = requestAnimationFrame(draw);
        };
        image
            .decode()
            .then(() => {
                pixels.src = image.currentSrc || image.src;
                return pixels.decode();
            })
            .then(build, () => doneRef.current());

        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
        };
    }, [playing, seed, imageRef]);

    return (
        <canvas
            ref={ref}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
        />
    );
};

export default TileReveal;
