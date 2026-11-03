'use client';

import { useEffect, useRef } from 'react';


/** One ambient square per this many CSS pixels, roughly the hero's tiles. */
const CELL = 48;
/** The glows barely move, so a tenth of a second between frames never shows. */
const DRIFT_MS = 100;
/** How long a palette change takes to fade through the glow. */
const PALETTE_FADE_MS = 1200;

/**
 * The build-in once the hero is scrolled away, matching the project covers:
 * each square fades on after a delay set by a diagonal sweep plus jitter.
 */
const STEP_MS = 34;
const JITTER_MS = 260;
const FADE_MS = 520;

/**
 * The soft colour behind the page, drawn as squares to match the tile field:
 * a canvas with one pixel per cell, scaled up with `image-rendering:
 * pixelated`. Three glows drift across a fixed grid, so squares brighten and
 * fade rather than sliding. Colours follow the hero's palette through the
 * --palette-a/b/c properties, which TileSettings writes. The fade between
 * palettes happens here, not as a CSS transition: those properties sit on
 * :root, and transitioning them restyled every element on the page each
 * frame for as long as the fade ran.
 *
 * The pixels are next to free, but every new frame makes each glass surface
 * above it blur again, so the drift is slow, and sleeps entirely under the
 * hero. With reduced motion it stops, and this draws
 * only when something changes: a palette, the theme, the window.
 */
const AmbientField = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        const root = document.documentElement;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        let cols = 0;
        let rows = 0;
        // Kept up to date by listeners: reading innerHeight or scrollY every
        // frame forced a layout each time.
        let viewportHeight = window.innerHeight;
        let pastHero = false;
        let underHero = true;
        let image: ImageData;
        // Per-cell reveal delay; revealAt is when the sweep began (0 = not yet).
        let delays = new Float32Array(0);
        let revealAt = 0;
        let revealed = false;

        const resize = () => {
            viewportHeight = window.innerHeight;
            const nextCols = Math.ceil(window.innerWidth / CELL) + 1;
            const nextRows = Math.ceil(window.innerHeight / CELL) + 1;
            // A phone's address bar moving rarely changes the grid.
            if (nextCols === cols && nextRows === rows) return;
            cols = nextCols;
            rows = nextRows;
            canvas.width = cols;
            canvas.height = rows;
            image = context.createImageData(cols, rows);
            delays = new Float32Array(cols * rows);
            for (let i = 0; i < delays.length; i++) {
                const col = i % cols;
                const row = (i - col) / cols;
                delays[i] = (col + row) * STEP_MS + Math.random() * JITTER_MS;
            }
        };

        // TileSettings writes plain hex onto the root's inline style, so it is
        // read straight from there; getComputedStyle would force a restyle.
        const rgb = (name: string, fallback: string) => {
            const value = root.style.getPropertyValue(name).trim() || fallback;
            const n = parseInt(value.slice(1), 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        };

        // Where the glows sit (fractions of the viewport), how wide they are
        // (in cells of viewport-min) and how strongly each shows per theme.
        const glows = [
            { x: 0.12, y: 0.28, r: 0.42, light: 0.34, dark: 0.24, speed: 0.07 },
            { x: 0.88, y: 0.58, r: 0.38, light: 0.3, dark: 0.26, speed: 0.05 },
            { x: 0.35, y: 0.9, r: 0.34, light: 0.24, dark: 0.2, speed: 0.06 },
        ];

        // Read only when TileSettings writes new values, never per frame.
        const readPalette = () => [
            rgb('--palette-a', '#f0b429'),
            rgb('--palette-b', '#6096e6'),
            rgb('--palette-c', '#e278a0'),
        ];
        let fadeTo = readPalette();
        let fadeFrom = fadeTo;
        let fadeStart = -Infinity;
        const colours = fadeTo.map((colour) => [...colour]);

        const blendPalette = (now: number) => {
            const t = Math.min(1, (now - fadeStart) / PALETTE_FADE_MS);
            // Smoothstep, close to the CSS `ease` this used to be.
            const eased = t * t * (3 - 2 * t);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    colours[i][j] =
                        fadeFrom[i][j] +
                        (fadeTo[i][j] - fadeFrom[i][j]) * eased;
                }
            }
        };

        const draw = (seconds: number, now: number) => {
            const since = revealed ? -1 : now - revealAt;
            const dark = root.dataset.theme === 'dark';
            blendPalette(now);
            const unit = Math.min(cols, rows);
            const data = image.data;

            const centres = glows.map((glow, i) => ({
                x:
                    (glow.x + 0.06 * Math.sin(seconds * glow.speed + i * 2)) *
                    cols,
                y:
                    (glow.y + 0.05 * Math.cos(seconds * glow.speed * 1.3 + i)) *
                    rows,
                r: glow.r * unit,
                a: dark ? glow.dark : glow.light,
            }));

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    let r = 0;
                    let g = 0;
                    let b = 0;
                    let alpha = 0;
                    for (let i = 0; i < 3; i++) {
                        const c = centres[i];
                        const dx = (col + 0.5 - c.x) / c.r;
                        const dy = (row + 0.5 - c.y) / c.r;
                        const w = Math.exp(-(dx * dx + dy * dy) * 3.2) * c.a;
                        r += colours[i][0] * w;
                        g += colours[i][1] * w;
                        b += colours[i][2] * w;
                        alpha += w;
                    }
                    const at = (row * cols + col) * 4;
                    const norm = alpha > 0 ? 1 / alpha : 0;
                    data[at] = r * norm;
                    data[at + 1] = g * norm;
                    data[at + 2] = b * norm;
                    const shown =
                        since < 0
                            ? 1
                            : Math.min(
                                  1,
                                  Math.max(
                                      0,
                                      (since - delays[row * cols + col]) /
                                          FADE_MS,
                                  ),
                              );
                    data[at + 3] = Math.min(1, alpha) * 255 * shown;
                }
            }
            context.putImageData(image, 0, 0);
        };

        let frame = 0;
        let last = 0;
        let dirty = true;
        const start = performance.now();

        const stillNow = () => reduced.matches;

        const tick = (now: number) => {
            frame = 0;
            if (!revealed) {
                // Held back until the visitor scrolls the hero half away, so
                // the build plays where it is seen rather than behind the
                // hero on load. Still modes skip the sweep and appear at once.
                // Scrolling or a change wakes this again.
                if (!pastHero) return;
                if (stillNow()) revealed = true;
                else if (!revealAt) revealAt = now;
                else if (
                    now - revealAt >
                    (cols + rows) * STEP_MS + JITTER_MS + FADE_MS
                ) {
                    revealed = true;
                }
            }

            const still = stillNow();
            const fading = now - fadeStart < PALETTE_FADE_MS;
            // Under the hero nothing shows, so the drift sleeps there too.
            const drifting = !still && !underHero;

            // The build-in too: it paints under every glass surface on screen,
            // and at full rate it stalled the scroll it plays during.
            if (
                dirty ||
                fading ||
                ((drifting || !revealed) && now - last >= DRIFT_MS)
            ) {
                dirty = false;
                last = now;
                draw(still ? 0 : (now - start) / 1000, now);
            }
            if (!revealed || fading || drifting) {
                frame = requestAnimationFrame(tick);
            }
        };

        const wake = () => {
            dirty = true;
            if (!frame) frame = requestAnimationFrame(tick);
        };

        const palette = new MutationObserver(() => {
            const next = readPalette();
            if (
                !next.every((colour, i) =>
                    colour.every((c, j) => c === fadeTo[i][j]),
                )
            ) {
                // From whatever is showing, which may be half way through a fade.
                fadeFrom = colours.map((colour) => [...colour]);
                fadeTo = next;
                fadeStart = performance.now();
            }
            wake();
        });
        palette.observe(root, {
            attributes: true,
            attributeFilter: ['style', 'data-theme'],
        });

        const onScroll = () => {
            const wasPast = pastHero;
            const wasUnder = underHero;
            pastHero = window.scrollY >= viewportHeight * 0.5;
            underHero = window.scrollY < viewportHeight * 0.25;
            if (pastHero !== wasPast || underHero !== wasUnder) wake();
        };

        const onResize = () => {
            resize();
            wake();
        };

        resize();
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
            palette.disconnect();
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return <canvas ref={ref} aria-hidden className="ambient" />;
};

export default AmbientField;
