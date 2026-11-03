'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

import { Close, Sliders } from '@/components/common/Icons';
import { useScrollLock } from '@/components/common/scrollLock';
import { prefersReducedMotion } from '@/components/common/motion';
import { attachCubeInput } from '@/components/cube/cubeInput';
import {
    createCubeRig,
    createPaletteFade,
    hexToUnit,
} from '@/components/cube/cubeRig';
import {
    Mat4,
    multiply,
    perspective,
    project,
    rotationX,
    translation,
} from '@/components/field/math';
import { createRenderer } from '@/components/field/renderer';
import { useTileSettings } from '@/components/hero/TileSettings';

const FOV = (30 * Math.PI) / 180;
/** Looking down on the floor. */
const TILT = (12 * Math.PI) / 180;
const BOB = 0.06;
const ZOOM_MAX = 1.8;

/**
 * The cube, full-screen: opened by clicking either toy cube, over a dimmed
 * and blurred page, with the settings docked beside it. Drag anywhere to
 * spin, scroll or pinch to zoom; a click off the cube, the close button or
 * Escape brings the page back.
 */
const CubeView = () => {
    const settings = useTileSettings();
    const {
        cubeView: open,
        setCubeView,
        controlsOpen,
        setControlsOpen,
        controlsAnchor,
    } = settings;
    const docked = controlsOpen && controlsAnchor === 'view';

    useScrollLock(open);
    // Rendered into <body>, which only exists once mounted in the browser.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setCubeView(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, setCubeView]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="The cube, full-screen"
                    className="cube-backdrop fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                    <Stage
                        settings={settings}
                        docked={docked}
                        onClose={() => setCubeView(false)}
                    />

                    <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
                        <button
                            type="button"
                            onClick={() =>
                                setControlsOpen(!controlsOpen, 'view')
                            }
                            aria-expanded={controlsOpen}
                            title="Settings"
                            className={`glass-pill btn-icon ${
                                controlsOpen
                                    ? '!text-ink ring-1 ring-inset ring-ink/30'
                                    : ''
                            }`}
                        >
                            <Sliders width={15} height={15} />
                            <span className="sr-only">Settings</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setCubeView(false)}
                            title="Close (Esc)"
                            className="glass-pill btn-icon"
                            autoFocus
                        >
                            <Close width={15} height={15} />
                            <span className="sr-only">Close the cube</span>
                        </button>
                    </div>

                    <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-micro text-white/60">
                        Drag to spin · scroll or pinch to zoom · click beside it
                        or Esc to close
                    </p>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};

/** The canvas and what it listens on: the whole screen. */
const Stage = ({
    settings,
    docked,
    onClose,
}: {
    settings: ReturnType<typeof useTileSettings>;
    /** The settings are docked beside it: keep the cube clear of them. */
    docked: boolean;
    onClose: () => void;
}) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const live = useRef({ settings, onClose });
    useEffect(() => {
        live.current = { settings, onClose };
    });

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        const canvas = document.createElement('canvas');
        canvas.className = 'block h-full w-full';
        host.append(canvas);
        const renderer = createRenderer(canvas, {
            alpha: true,
            onRestored: () => {},
        });
        if (!renderer) return;

        const reduced = prefersReducedMotion();
        const palette = createPaletteFade(reduced);
        const rig = createCubeRig(true, reduced);
        let width = 1;
        let height = 1;
        let zoom = 1;
        let zoomAim = 1;
        let pinchFrom = 0;
        let zoomAtPinch = 1;
        let viewProjection = new Float32Array(16) as Mat4;

        const layout = () => {
            width = Math.max(1, host.clientWidth);
            height = Math.max(1, host.clientHeight);
            renderer.resize(
                width,
                height,
                Math.min(window.devicePixelRatio || 1, 2),
            );
        };
        layout();
        const resizer = new ResizeObserver(layout);
        resizer.observe(host);

        const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(1, z));

        const detach = attachCubeInput(host, rig.spin, {
            reduced,
            onTap: (x, y) => {
                const box = host.getBoundingClientRect();
                const [cx, cy] = project(viewProjection, 0, 0, 0);
                const off = Math.hypot(
                    x - box.left - ((cx + 1) / 2) * width,
                    y - box.top - ((1 - cy) / 2) * height,
                );
                // A click beside the cube, on the backdrop, closes the view.
                if (off > Math.min(width, height) * 0.24 * zoom) {
                    live.current.onClose();
                }
            },
            onPinch: (span) => {
                if (!span) {
                    pinchFrom = 0;
                    return;
                }
                if (!pinchFrom) {
                    pinchFrom = span;
                    zoomAtPinch = zoomAim;
                }
                zoomAim = clampZoom((zoomAtPinch * span) / pinchFrom);
            },
        });
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            zoomAim = clampZoom(zoomAim * Math.exp(-event.deltaY * 0.004));
        };
        host.addEventListener('wheel', onWheel, { passive: false });

        let frame = 0;
        let last = performance.now();
        let drift = 0;
        let floor = -1;

        const tick = (now: number) => {
            frame = requestAnimationFrame(tick);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            drift += dt;
            const s = live.current.settings;
            const ramp = palette.update(s.gradient, dt);
            if (ramp) renderer.setRamp(ramp);
            const body = rig.step(dt, s.wave, s.cube);
            zoom += (zoomAim - zoom) * (reduced ? 1 : 1 - Math.exp(-dt / 0.15));

            // Zoom 1 fills the stage: the cube, its floor and reflection all
            // on screen whichever way it turns.
            const lift = rig.lift();
            const r = (Math.sqrt(3) / 2) * (1 + 2 * lift);
            const top = r + BOB;
            const bottom = -(r + BOB + 0.14) - 0.8;
            const aim = (top + bottom) / 2;
            const tanV = Math.tan(FOV / 2);
            const tanH = tanV * (width / height);
            const fit =
                Math.max((top - bottom) / 2 / tanV, r / tanH) * 1.06 + r * 0.5;
            const distance = fit / zoom;
            viewProjection = multiply(
                perspective(
                    FOV,
                    width / height,
                    Math.max(0.1, distance - 4),
                    distance + 6,
                ),
                multiply(
                    translation(0, -aim, -distance),
                    rotationX(Math.PI / 2 - TILT),
                ),
            );

            const rise = reduced ? 0 : Math.sin(drift * 0.9) * BOB;
            const low = -r * body.scale - BOB - 0.14;
            floor =
                low < floor
                    ? low
                    : floor + (low - floor) * (1 - Math.exp(-dt / 1.2));
            const model = rig.matrix(Math.max(0.001, body.scale), 0, 0, rise);
            const reflect = Float32Array.of(
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                -1,
                0,
                0,
                0,
                2 * floor,
                1,
            );

            renderer.draw({
                viewProjection,
                paper: [0, 0, 0],
                ink: [1, 1, 1],
                field: null,
                cube: {
                    model,
                    columns: body.columns,
                    wave: body.wave,
                    phase: body.phase,
                    cube: body.cube,
                    coreColor: hexToUnit(body.cube.coreColor),
                    gain: palette.gain(),
                    tints: palette.tints(),
                    floor: { z: floor, model: multiply(reflect, model) },
                },
            });
        };
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
            resizer.disconnect();
            detach();
            host.removeEventListener('wheel', onWheel);
            renderer.dispose();
            canvas.remove();
        };
    }, []);

    return (
        <div
            ref={hostRef}
            // With the settings docked the cube takes the space they leave:
            // above the drawer on a phone, following it as it is pulled up
            // (--settings-sheet), and to their left on anything wider.
            className={`absolute inset-x-0 top-0 cursor-grab touch-none select-none transition-[right] duration-300 active:cursor-grabbing ${
                docked
                    ? 'bottom-[var(--settings-sheet,0px)] sm:bottom-0 sm:right-[calc(20rem+1.5rem)]'
                    : 'bottom-0 right-0'
            }`}
        />
    );
};

export default CubeView;
