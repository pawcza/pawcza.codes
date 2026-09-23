'use client';

import { useEffect, useRef } from 'react';

import {
    GradientName,
    HoverEffect,
    RAMP_LENGTH,
    WaveSettings,
    colorIndexAt,
    customPaletteVersion,
    previousCustomChannels,
    lensMagnify,
    lensRadius,
    ramps,
    rgbRamps,
    waveKeys,
} from '@/components/hero/tiles';
import { markHeroPainted } from '@/components/hero/ready';
import { useIntroDone } from '@/components/common/intro';
import { createTileGl } from '@/components/hero/tileGl';
import {
    SOFTWARE_EVENT,
    isSoftwareRendered,
    markSoftwareRendered,
    refreshMeasured,
    slowFrameMs,
    whenRefreshMeasured,
} from '@/components/common/gpu';

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Draw one frame and stop, rather than animating. */
const holdStill = () => prefersReducedMotion() || isSoftwareRendered();

/**
 * Seconds for a settings change to land. Exponential smoothing, so this is the
 * time constant: roughly three of them to arrive, giving ~0.4s overall.
 */
const SETTLE = 0.13;
/** Seconds for one palette to cross-fade into the next. */
const PALETTE_FADE = 0.45;
/** Time constant for the lens trailing after wherever it is headed. */
const CHASE = 0.09;
/**
 * Time constants for the cursor taking the lens over from its own drift, and
 * for giving it back. Asymmetric on purpose: grabbing it should feel
 * immediate, while letting go of it in the same time whips the bulge back
 * across the hero.
 */
const GRAB = 0.22;
const RELEASE = 0.9;
/** Time constant for the lens fading in on first paint. */
const BLOOM = 0.5;
/**
 * The build-in, in the covers' rhythm: how long the diagonal sweep takes to
 * cross the field, plus TileReveal's jitter and pop (baked into the shader).
 */
const REVEAL_SWEEP = 900;
const REVEAL_TOTAL = REVEAL_SWEEP + 160 + 420;

/**
 * The tile field, rasterised onto a single canvas.
 *
 * The previous version of this site mounted one <div> per tile, several
 * hundred of them, and re-rendered the whole tree from a 60fps setInterval.
 * Here the grid never touches the DOM: one canvas, one rAF loop, and the loop
 * stops entirely when the hero scrolls out of view or the tab is hidden.
 *
 * The pixels come from a WebGL shader (tileGl.ts) wherever WebGL exists; the
 * Canvas2D drawing below is the fallback. Everything that moves is worked out
 * here either way.
 */
const TileCanvas = ({
    gradient,
    wave,
    effect,
}: {
    gradient: GradientName;
    wave: WaveSettings;
    effect: HoverEffect;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // The loop reads settings from refs, so dragging a slider never restarts it.
    const gradientRef = useRef(gradient);
    const waveRef = useRef(wave);
    const effectRef = useRef(effect);
    const drawStillRef = useRef<() => void>(() => {});
    // The field builds in once the loader has cleared (the hero) or once it is
    // scrolled into view (the footer), whichever is later.
    const introDone = useIntroDone();
    const introRef = useRef(false);
    useEffect(() => {
        introRef.current = introDone;
    }, [introDone]);

    useEffect(() => {
        gradientRef.current = gradient;
        waveRef.current = wave;
        effectRef.current = effect;
        // When holding still, no loop is running to pick the change up.
        if (holdStill()) drawStillRef.current();
    }, [gradient, wave, effect]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Decided once: a canvas that has handed out a WebGL context can never
        // give a 2D one.
        const glRenderer = createTileGl(canvas, () => restart());
        const context = glRenderer
            ? null
            : canvas.getContext('2d', { alpha: false });
        if (!glRenderer && !context) return;

        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );

        let frame = 0;
        let width = 0;
        let height = 0;
        let visible = true;
        let disposed = false;

        // Build-in state. Plain paper until it starts; skipped outright where
        // nothing animates, and by the Canvas2D fallback.
        let revealStart = 0;
        let revealed = !glRenderer;
        let revealWanted = false;
        const revealSeed = Math.random() * 100;
        const revealFromX = Math.random() < 0.5 ? 1 : 0;
        const revealFromY = Math.random() < 0.5 ? 1 : 0;
        let paper: [number, number, number] = [244, 244, 241];

        // Cached so pointermove never forces a layout.
        let bounds = canvas.getBoundingClientRect();

        // The lens wanders the field on its own and only defers to the
        // cursor while one is actually over the hero. `follow` is how much of
        // that handover has happened, so neither taking it nor giving it back
        // ever snaps; `influence` fades the whole lens in on first paint.
        const pointer = { x: -9999, y: -9999, toX: -9999, toY: -9999 };
        let placed = false;
        let drift = 0;
        let follow = 0;
        let followTarget = 0;
        let influence = 0;

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
        let seenCustom = customPaletteVersion();
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

            if (glRenderer) {
                glRenderer.resize(width, height, dpr);
                return;
            }
            if (!context) return;
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

            // Same name, new colours: the custom palette was re-mixed. Fade
            // from the outgoing custom ramp, as for any palette change.
            if (
                paletteTo === 'custom' &&
                gradientRef.current === 'custom' &&
                seenCustom !== customPaletteVersion()
            ) {
                seenCustom = customPaletteVersion();
                if (paletteBlend >= 1) {
                    paletteFrom = new Uint8ClampedArray(
                        previousCustomChannels(),
                    );
                }
                paletteBlend = 0;
            }

            if (gradientRef.current !== paletteTo) {
                if (gradientRef.current === 'custom') {
                    seenCustom = customPaletteVersion();
                }
                // Snapshot whatever is on screen right now, mid-fade or not.
                snapshotPalette(paletteFrom, paletteTo, paletteBlend);
                paletteTo = gradientRef.current;
                paletteBlend = 0;
            }

            if (paletteBlend < 1 && delta > 0) {
                paletteBlend = Math.min(1, paletteBlend + delta / PALETTE_FADE);
            }

            // Derived per frame so changing tile size needs no canvas resize.
            const columns = Math.max(1, Math.ceil(width / settings.tileSize));
            const rows = Math.max(1, Math.ceil(height / settings.tileSize));
            const tileWidth = width / columns;
            const tileHeight = height / rows;

            // Where the lens wants to be: its own slow wander, handed over
            // to the cursor for as long as one is hovering. The path is a
            // Lissajous with deliberately unrelated frequencies, so it crosses
            // the whole field instead of retracing one short loop.
            drift += delta;
            const driftX = width * (0.5 + 0.34 * Math.sin(drift * 0.19));
            const driftY = height * (0.5 + 0.3 * Math.sin(drift * 0.13 + 1.7));

            const handover = followTarget > follow ? GRAB : RELEASE;
            follow +=
                (followTarget - follow) *
                (delta > 0 ? 1 - Math.exp(-delta / handover) : 0);

            const toX = driftX + (pointer.toX - driftX) * follow;
            const toY = driftY + (pointer.toY - driftY) * follow;

            // First frame starts on the path rather than gliding in from
            // wherever the uninitialised pointer happened to be.
            if (!placed) {
                placed = true;
                pointer.x = toX;
                pointer.y = toY;
            }

            // Trailing the target rather than pinning to it is what gives a
            // flicked cursor a bulge that follows it.
            const chase = delta > 0 ? 1 - Math.exp(-delta / CHASE) : 0;
            pointer.x += (toX - pointer.x) * chase;
            pointer.y += (toY - pointer.y) * chase;

            // Nothing repaints under reduced motion, so leaving the lens at
            // zero there keeps the still frame a plain grid.
            if (!reducedMotion.matches && !isSoftwareRendered() && delta > 0) {
                influence += (1 - influence) * (1 - Math.exp(-delta / BLOOM));
            }

            if (glRenderer) {
                const isGrid = effectRef.current === 'grid';
                const magnify = lensMagnify(settings.lens, influence);
                const radius = lensRadius(settings.lens);
                const gridAlpha = settings.gridOpacity * influence;
                const lensOn =
                    influence > 0.01 && Math.abs(magnify - 1) >= 0.002;
                glRenderer.draw({
                    width,
                    height,
                    columns,
                    rows,
                    tileWidth,
                    tileHeight,
                    settings,
                    phase,
                    ramp:
                        paletteBlend >= 1
                            ? rgbRamps[paletteTo]
                            : mixChannels(paletteFrom, paletteTo, paletteBlend),
                    rampBlending: paletteBlend < 1,
                    mode: isGrid
                        ? gridAlpha < 0.01
                            ? 'plain'
                            : 'grid'
                        : lensOn
                          ? 'lens'
                          : 'plain',
                    pointerX: pointer.x,
                    pointerY: pointer.y,
                    radiusX: radius * settings.reachX,
                    radiusY: radius * settings.reachY,
                    magnify,
                    ink:
                        document.documentElement.dataset.theme === 'dark'
                            ? [237, 237, 240]
                            : [22, 22, 26],
                    gridAlpha,
                    gridReach: settings.gridReach,
                    gridLine: settings.gridLine,
                    gridNudge: Math.round(settings.gridLine) % 2 ? 0.5 : 0,
                    reveal: revealFrame(columns, rows),
                });
                return;
            }

            if (!context) return;

            const ramp =
                paletteBlend >= 1
                    ? ramps[paletteTo]
                    : mixPalette(paletteFrom, paletteTo, paletteBlend);

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

            if (effectRef.current === 'grid') {
                /*
                 * Grid: the tile boundaries drawn as lines, in the page's ink
                 * colour, masked by a radial gradient around the cursor (or
                 * the drift), so a patch of grid shows through and fades out.
                 */
                const reach = settings.gridReach;
                const alpha = settings.gridOpacity * influence;
                if (alpha < 0.01) return;
                const ink =
                    document.documentElement.dataset.theme === 'dark'
                        ? '237, 237, 240'
                        : '22, 22, 26';
                const glow = context.createRadialGradient(
                    pointer.x,
                    pointer.y,
                    0,
                    pointer.x,
                    pointer.y,
                    reach,
                );
                glow.addColorStop(0, `rgba(${ink}, ${alpha})`);
                glow.addColorStop(0.55, `rgba(${ink}, ${alpha * 0.45})`);
                glow.addColorStop(1, `rgba(${ink}, 0)`);
                context.strokeStyle = glow;
                context.lineWidth = settings.gridLine;
                // Odd widths sit on half pixels to stay crisp.
                const nudge = Math.round(settings.gridLine) % 2 ? 0.5 : 0;
                const top = Math.max(0, pointer.y - reach);
                const bottom = Math.min(height, pointer.y + reach);
                const left = Math.max(0, pointer.x - reach);
                const right = Math.min(width, pointer.x + reach);
                context.beginPath();
                for (
                    let col = Math.ceil(left / tileWidth);
                    col * tileWidth <= right;
                    col++
                ) {
                    const x = Math.round(col * tileWidth) + nudge;
                    context.moveTo(x, top);
                    context.lineTo(x, bottom);
                }
                for (
                    let row = Math.ceil(top / tileHeight);
                    row * tileHeight <= bottom;
                    row++
                ) {
                    const y = Math.round(row * tileHeight) + nudge;
                    context.moveTo(left, y);
                    context.lineTo(right, y);
                }
                context.stroke();
                return;
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

        /** The in-between palette as channels, for the shader. */
        const blendedChannels = new Uint8ClampedArray(RAMP_LENGTH * 3);
        function mixChannels(
            from: Uint8ClampedArray,
            to: GradientName,
            blend: number,
        ) {
            const toChannels = rgbRamps[to];
            for (let i = 0; i < blendedChannels.length; i++) {
                blendedChannels[i] =
                    from[i] + (toChannels[i] - from[i]) * blend;
            }
            return blendedChannels;
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

        function revealFrame(columns: number, rows: number) {
            if (revealed) return null;
            const time = revealStart ? performance.now() - revealStart : -1;
            if (time >= REVEAL_TOTAL) {
                revealed = true;
                return null;
            }
            return {
                time,
                step: REVEAL_SWEEP / Math.max(1, columns + rows - 2),
                fromX: revealFromX,
                fromY: revealFromY,
                seed: revealSeed,
                paper,
            };
        }

        const startReveal = (now: number) => {
            if (revealed || revealStart || !revealWanted || !introRef.current) {
                return;
            }
            // Whatever the page is under the field right now, light or dark.
            const value = getComputedStyle(document.documentElement)
                .getPropertyValue('--paper')
                .trim();
            if (/^#[0-9a-f]{6}$/i.test(value)) {
                const n = parseInt(value.slice(1), 16);
                paper = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
            }
            revealStart = now;
        };

        // Nothing eases under reduced motion; land on the target immediately.
        drawStillRef.current = () => {
            // Nor does it build in: a still field is simply there.
            revealed = true;
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

        /*
         * Frame-rate watchdog. The GPU probe misses some software renderers,
         * so the loop also times itself: whenever the median gap between
         * frames over a window of real, visible animation says the page is
         * struggling (relative to the screen's own refresh, see slowFrameMs),
         * it falls back to a still frame for good.
         */
        const gaps: number[] = [];
        let windowTime = 0;
        let previous = 0;
        const SAMPLE = 90;

        const watch = (now: number) => {
            const gap = previous ? now - previous : 0;
            previous = now;
            // Pauses (hidden tab, hero scrolled away) go through stop(),
            // which resets `previous`, so a long gap here is genuine
            // slowness. Only absurd gaps, like a laptop waking, are skipped.
            if (gap <= 0 || gap > 5000) return;
            gaps.push(gap);
            windowTime += gap;
            // A window is 90 frames or two seconds, whichever comes first, so
            // a badly struggling page is caught quickly too.
            if (
                gaps.length < SAMPLE &&
                !(windowTime > 2000 && gaps.length >= 8)
            ) {
                return;
            }
            // Judged window by window, for as long as it runs: a slow page
            // is not always slow in the first second after load.
            const median = gaps.sort((a, b) => a - b)[gaps.length >> 1];
            gaps.length = 0;
            windowTime = 0;
            if (median > slowFrameMs()) markSoftwareRendered();
        };

        const loop = (now: number) => {
            startReveal(now);
            drawAndSignal((now - start) / 1000);
            watch(now);
            if (isSoftwareRendered()) {
                frame = 0;
                drawStillRef.current();
                return;
            }
            frame = requestAnimationFrame(loop);
        };

        const stop = () => {
            if (frame) {
                cancelAnimationFrame(frame);
                frame = 0;
            }
            previous = 0;
        };

        const play = () => {
            if (frame || !visible || document.hidden) return;
            if (holdStill()) {
                revealed = true;
                drawAndSignal(0);
                return;
            }
            // First frame only, until the screen's frame rate is known; the
            // loader is still covering the page while it is measured.
            if (!refreshMeasured()) {
                drawAndSignal(0);
                whenRefreshMeasured().then(() => {
                    if (!disposed) play();
                });
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

        // Builds once a third of it is on screen, as the covers do.
        const revealObserver = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                revealWanted = true;
                revealObserver.disconnect();
            },
            { threshold: 0.33 },
        );
        revealObserver.observe(canvas);

        const onVisibility = () => (document.hidden ? stop() : play());

        // Touch has no hover to hand the lens over to, and a pointermove
        // fired mid scroll-drag would only yank it off its path, so following
        // is mouse-only. The drift is the whole show on a phone.
        const finePointer = window.matchMedia('(pointer: fine)');

        const onPointerMove = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse') return;

            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;

            // Only a real hover takes the lens over. Anywhere else on the
            // page it is left to carry on drifting.
            if (x < 0 || y < 0 || x > width || y > height) {
                followTarget = 0;
                return;
            }

            pointer.toX = x;
            pointer.toY = y;
            followTarget = 1;
        };

        const onPointerLeave = () => {
            followTarget = 0;
        };

        const onScroll = () => {
            bounds = canvas.getBoundingClientRect();
        };

        const interactive = finePointer.matches && !holdStill();

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
        window.addEventListener(SOFTWARE_EVENT, restart);
        document.addEventListener('visibilitychange', onVisibility);
        reducedMotion.addEventListener('change', restart);

        return () => {
            disposed = true;
            stop();
            glRenderer?.dispose();
            observer.disconnect();
            revealObserver.disconnect();
            window.removeEventListener('resize', restart);
            window.removeEventListener(SOFTWARE_EVENT, restart);
            document.removeEventListener('visibilitychange', onVisibility);
            reducedMotion.removeEventListener('change', restart);
            window.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerleave', onPointerLeave);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    return (
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
    );
};

export default TileCanvas;
