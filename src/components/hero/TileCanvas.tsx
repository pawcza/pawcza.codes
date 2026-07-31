'use client';

import { useEffect, useRef } from 'react';

import {
    GradientName,
    RAMP_LENGTH,
    WaveSettings,
    colorIndexAt,
    lensMagnify,
    lensRadius,
    ramps,
    rgbRamps,
    waveKeys,
} from '@/components/hero/tiles';
import { markHeroPainted } from '@/components/hero/ready';

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Seconds for a settings change to land. Exponential smoothing, so this is the
 * time constant: roughly three of them to arrive, giving ~0.4s overall.
 */
const SETTLE = 0.13;
/** Seconds for one palette to cross-fade into the next. */
const PALETTE_FADE = 0.45;

/**
 * The tile field, rasterised onto a single canvas.
 *
 * The previous version of this site mounted one <div> per tile, several
 * hundred of them, and re-rendered the whole tree from a 60fps setInterval.
 * Here the grid never touches the DOM: one canvas, one rAF loop, and the loop
 * stops entirely when the hero scrolls out of view or the tab is hidden.
 */
const TileCanvas = ({
    gradient,
    wave,
}: {
    gradient: GradientName;
    wave: WaveSettings;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // The loop reads settings from refs, so dragging a slider never restarts it.
    const gradientRef = useRef(gradient);
    const waveRef = useRef(wave);
    const drawStillRef = useRef<() => void>(() => {});

    useEffect(() => {
        gradientRef.current = gradient;
        waveRef.current = wave;
        // Under reduced motion no loop is running to pick the change up.
        if (prefersReducedMotion()) drawStillRef.current();
    }, [gradient, wave]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );

        let frame = 0;
        let width = 0;
        let height = 0;
        let visible = true;

        // Cached so pointermove never forces a layout.
        let bounds = canvas.getBoundingClientRect();

        // The cursor is followed with easing and its influence fades in and
        // out, so the field never snaps when the pointer enters or leaves.
        const pointer = { x: -9999, y: -9999, toX: -9999, toY: -9999 };
        let influence = 0;
        let influenceTarget = 0;

        // The settings actually being drawn, easing towards whatever the
        // sliders say, so randomising glides into place instead of cutting.
        const shown: WaveSettings = { ...waveRef.current };

        // Phase is accumulated rather than recomputed from elapsed time, so
        // changing speed alters the rate from here on instead of rewriting
        // where the wave already is.
        let phase = 0;
        let lastFrame = 0;

        // Palette cross-fade. `paletteFrom` holds the colours being faded out
        // of, which may itself be a half-finished blend when the palette is
        // changed again mid-fade.
        let paletteFrom = new Uint8ClampedArray(rgbRamps[gradientRef.current]);
        let paletteTo: GradientName = gradientRef.current;
        let paletteBlend = 1;
        const blendedRamp: string[] = new Array(RAMP_LENGTH);

        // Warped grid vertices, reused between frames so the draw allocates
        // nothing. Grown on demand when the lens area changes.
        let vertexX = new Float64Array(0);
        let vertexY = new Float64Array(0);

        /**
         * Maps a normalised distance from the cursor to its lensed distance.
         *
         * Cubic Hermite with g(0)=0, g(1)=1, g'(0)=magnify and g'(1)=1: the
         * centre spreads by `magnify`, and the rim meets the untouched grid at
         * matching slope so there is no crease. Stays monotonic below 4x,
         * which is what keeps the warp from folding over itself.
         */
        const lensCurve = (u: number, magnify: number) => {
            const a = magnify - 1;
            return a * u * u * u - 2 * a * u * u + magnify * u;
        };

        const resize = () => {
            bounds = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            width = bounds.width;
            height = bounds.height;

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const draw = (elapsed: number) => {
            const delta = lastFrame ? Math.min(0.1, elapsed - lastFrame) : 0;
            lastFrame = elapsed;

            // Ease every slider towards its target.
            const settle = delta > 0 ? 1 - Math.exp(-delta / SETTLE) : 0;
            const target = waveRef.current;
            for (const key of waveKeys) {
                shown[key] += (target[key] - shown[key]) * settle;
            }

            const settings = shown;
            phase += settings.speed * delta * 60;

            if (gradientRef.current !== paletteTo) {
                // Snapshot whatever is on screen right now, mid-fade or not.
                snapshotPalette(paletteFrom, paletteTo, paletteBlend);
                paletteTo = gradientRef.current;
                paletteBlend = 0;
            }

            if (paletteBlend < 1 && delta > 0) {
                paletteBlend = Math.min(1, paletteBlend + delta / PALETTE_FADE);
            }

            const ramp =
                paletteBlend >= 1
                    ? ramps[paletteTo]
                    : mixPalette(paletteFrom, paletteTo, paletteBlend);

            // Derived per frame so changing tile size needs no canvas resize.
            const columns = Math.max(1, Math.ceil(width / settings.tileSize));
            const rows = Math.max(1, Math.ceil(height / settings.tileSize));
            const tileWidth = width / columns;
            const tileHeight = height / rows;

            // Ease the cursor and its influence towards their targets.
            pointer.x += (pointer.toX - pointer.x) * 0.2;
            pointer.y += (pointer.toY - pointer.y) * 0.2;
            influence += (influenceTarget - influence) * 0.12;

            const colorAt = (col: number, row: number) =>
                ramp[colorIndexAt(col, row, phase, ramp.length, settings)];

            // Plain grid first, so every pixel is covered whatever the lens
            // does and antialiased quad edges blend into the right colour.
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    context.fillStyle = colorAt(col, row);
                    // +1 avoids seams from sub-pixel tile edges.
                    context.fillRect(
                        Math.floor(col * tileWidth),
                        Math.floor(row * tileHeight),
                        Math.ceil(tileWidth) + 1,
                        Math.ceil(tileHeight) + 1,
                    );
                }
            }

            const magnify = lensMagnify(settings.lens, influence);
            // Neutral lens leaves the grid exactly as drawn above.
            if (influence <= 0.01 || Math.abs(magnify - 1) < 0.002) return;

            // The lens displaces grid *vertices* radially and redraws each
            // affected tile as a quad between its four corners. Warping whole
            // rows and columns instead was cheaper but magnified a cross
            // through the cursor rather than a disc; scaling tiles one by one
            // was circular but made them overlap, and then draw order decided
            // who owned the shared strip, which flipped on every cell
            // boundary. Sharing corners has neither problem.
            const radius = lensRadius(settings.lens);
            // Reach is per axis, so the lens can be an ellipse rather than
            // only a circle.
            const radiusX = radius * settings.reachX;
            const radiusY = radius * settings.reachY;
            const firstCol = Math.max(
                0,
                Math.floor((pointer.x - radiusX) / tileWidth),
            );
            const lastCol = Math.min(
                columns - 1,
                Math.ceil((pointer.x + radiusX) / tileWidth),
            );
            const firstRow = Math.max(
                0,
                Math.floor((pointer.y - radiusY) / tileHeight),
            );
            const lastRow = Math.min(
                rows - 1,
                Math.ceil((pointer.y + radiusY) / tileHeight),
            );

            if (lastCol < firstCol || lastRow < firstRow) return;

            // One more vertex than cells in each direction.
            const vertexCols = lastCol - firstCol + 2;
            const vertexRows = lastRow - firstRow + 2;
            const vertexCount = vertexCols * vertexRows;

            if (vertexX.length < vertexCount) {
                vertexX = new Float64Array(vertexCount);
                vertexY = new Float64Array(vertexCount);
            }

            for (let j = 0; j < vertexRows; j++) {
                const at = (firstRow + j) * tileHeight;
                const dy = at - pointer.y;

                for (let i = 0; i < vertexCols; i++) {
                    const across = (firstCol + i) * tileWidth;
                    const dx = across - pointer.x;
                    const index = j * vertexCols + i;

                    // Distance measured in units of the ellipse, so `spread`
                    // is 1 exactly on the rim whatever the two reaches are.
                    const nx = dx / radiusX;
                    const ny = dy / radiusY;
                    const spread = Math.sqrt(nx * nx + ny * ny);

                    // Vertices on or beyond the rim never move, so the lensed
                    // tiles cover exactly the same area as the grid beneath.
                    if (spread >= 1) {
                        vertexX[index] = across;
                        vertexY[index] = at;
                        continue;
                    }

                    // At the very centre the curve is linear, so the ratio
                    // tends to the magnification rather than dividing by zero.
                    const push =
                        spread < 1e-6
                            ? magnify
                            : lensCurve(spread, magnify) / spread;

                    vertexX[index] = pointer.x + dx * push;
                    vertexY[index] = pointer.y + dy * push;
                }
            }

            for (let row = firstRow; row <= lastRow; row++) {
                const j = row - firstRow;

                for (let col = firstCol; col <= lastCol; col++) {
                    const topLeft = j * vertexCols + (col - firstCol);
                    const topRight = topLeft + 1;
                    const bottomLeft = topLeft + vertexCols;
                    const bottomRight = bottomLeft + 1;

                    context.fillStyle = colorAt(col, row);
                    context.beginPath();
                    context.moveTo(vertexX[topLeft], vertexY[topLeft]);
                    context.lineTo(vertexX[topRight], vertexY[topRight]);
                    context.lineTo(vertexX[bottomRight], vertexY[bottomRight]);
                    context.lineTo(vertexX[bottomLeft], vertexY[bottomLeft]);
                    context.closePath();
                    context.fill();
                }
            }
        };

        /** Writes the currently visible colours into `into`. */
        function snapshotPalette(
            into: Uint8ClampedArray,
            to: GradientName,
            blend: number,
        ) {
            const toChannels = rgbRamps[to];
            if (blend >= 1) {
                into.set(toChannels);
                return;
            }
            for (let i = 0; i < into.length; i++) {
                into[i] += (toChannels[i] - into[i]) * blend;
            }
        }

        /** Builds the in-between palette for this frame. */
        function mixPalette(
            from: Uint8ClampedArray,
            to: GradientName,
            blend: number,
        ) {
            const toChannels = rgbRamps[to];
            for (let i = 0; i < RAMP_LENGTH; i++) {
                const at = i * 3;
                const r = from[at] + (toChannels[at] - from[at]) * blend;
                const g =
                    from[at + 1] + (toChannels[at + 1] - from[at + 1]) * blend;
                const b =
                    from[at + 2] + (toChannels[at + 2] - from[at + 2]) * blend;
                blendedRamp[i] =
                    `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
            }
            return blendedRamp;
        }

        // Nothing eases under reduced motion; land on the target immediately.
        drawStillRef.current = () => {
            Object.assign(shown, waveRef.current);
            paletteTo = gradientRef.current;
            paletteFrom = new Uint8ClampedArray(rgbRamps[paletteTo]);
            paletteBlend = 1;
            lastFrame = 0;
            draw(0);
        };

        const drawAndSignal = (time: number) => {
            draw(time);
            markHeroPainted();
        };

        const start = performance.now();

        const loop = (now: number) => {
            drawAndSignal((now - start) / 1000);
            frame = requestAnimationFrame(loop);
        };

        const stop = () => {
            if (frame) {
                cancelAnimationFrame(frame);
                frame = 0;
            }
        };

        const play = () => {
            if (frame || !visible || document.hidden) return;
            if (reducedMotion.matches) {
                drawAndSignal(0);
                return;
            }
            frame = requestAnimationFrame(loop);
        };

        const restart = () => {
            stop();
            resize();
            play();
        };

        // Only animate while the hero is actually on screen.
        const observer = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting;
                if (visible) play();
                else stop();
            },
            { threshold: 0 },
        );
        observer.observe(canvas);

        const onVisibility = () => (document.hidden ? stop() : play());

        // Nothing repaints under reduced motion, and a touch "pointer" would
        // leave the field frozen mid-bulge, so this is mouse-only.
        const finePointer = window.matchMedia('(pointer: fine)');

        const onPointerMove = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse') return;
            pointer.toX = event.clientX - bounds.left;
            pointer.toY = event.clientY - bounds.top;
            // Jump rather than glide in from the last known position.
            if (influenceTarget === 0) {
                pointer.x = pointer.toX;
                pointer.y = pointer.toY;
            }
            influenceTarget = 1;
        };

        const onPointerLeave = () => {
            influenceTarget = 0;
        };

        const onScroll = () => {
            bounds = canvas.getBoundingClientRect();
        };

        const interactive = finePointer.matches && !reducedMotion.matches;

        if (interactive) {
            window.addEventListener('pointermove', onPointerMove, {
                passive: true,
            });
            document.addEventListener('pointerleave', onPointerLeave);
            window.addEventListener('scroll', onScroll, { passive: true });
        }

        resize();
        play();

        window.addEventListener('resize', restart);
        document.addEventListener('visibilitychange', onVisibility);
        reducedMotion.addEventListener('change', restart);

        return () => {
            stop();
            observer.disconnect();
            window.removeEventListener('resize', restart);
            document.removeEventListener('visibilitychange', onVisibility);
            reducedMotion.removeEventListener('change', restart);
            window.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerleave', onPointerLeave);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
};

export default TileCanvas;
